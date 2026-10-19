import { beforeAll, beforeEach, afterAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
const enabled = Boolean(process.env.TEST_DATABASE_URL);
describe.skipIf(!enabled)("MongoDB transactional order lifecycle", () => {
  let db: PrismaClient,
    service: typeof import("../lib/orders"),
    userId: string,
    adminId: string,
    otherAdmin: string,
    fromId: string,
    toId: string;
  beforeAll(async () => {
    const url = new URL(process.env.TEST_DATABASE_URL!);
    if (!url.pathname.startsWith("/exchangehub_validation_"))
      throw new Error(
        "Integration tests require an isolated validation database",
      );
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    process.env.BETTER_AUTH_SECRET =
      "integration-test-secret-at-least-32-characters";
    db = (await import("../lib/db")).db;
    service = await import("../lib/orders");
  });
  beforeEach(async () => {
    await db.auditEvent.deleteMany();
    await db.order.deleteMany();
    await db.quote.deleteMany();
    await db.savedAccount.deleteMany();
    await db.session.deleteMany();
    await db.account.deleteMany();
    await db.user.deleteMany();
    await db.exchangePair.deleteMany();
    await db.paymentMethod.deleteMany();
    userId = (
      await db.user.create({
        data: {
          name: "Test customer",
          email: "customer@example.test",
          emailVerified: true,
        },
      })
    ).id;
    adminId = (
      await db.user.create({
        data: {
          name: "Test admin",
          email: "admin@example.test",
          role: "ADMIN",
          emailVerified: true,
        },
      })
    ).id;
    otherAdmin = (
      await db.user.create({
        data: {
          name: "Other admin",
          email: "admin2@example.test",
          role: "ADMIN",
          emailVerified: true,
        },
      })
    ).id;
    fromId = (
      await db.paymentMethod.create({
        data: {
          slug: "bkash",
          name: "bKash",
          currency: "BDT",
          kind: "PHONE",
          reserve: "10000",
          enabled: true,
          receivingAccount: "01712345678",
        },
      })
    ).id;
    toId = (
      await db.paymentMethod.create({
        data: {
          slug: "payoneer",
          name: "Payoneer",
          currency: "USD",
          kind: "EMAIL",
          reserve: "100",
          enabled: true,
          receivingAccount: "platform@example.test",
        },
      })
    ).id;
    await db.exchangePair.create({
      data: {
        fromId,
        toId,
        rate: "0.01",
        min: "100",
        max: "20000",
        enabled: true,
      },
    });
    await db.siteSettings.upsert({
      where: { key: "main" },
      create: { key: "main", online: true, acceptingOrders: true },
      update: { online: true, acceptingOrders: true },
    });
  });
  afterAll(async () => {
    await db?.$disconnect();
  });
  const input = (amount = "1000") => ({
    fromId,
    toId,
    amount,
    destination: "receiver@example.test",
    requestKey: randomUUID(),
  });
  const processInput = (
    status: "PROCESSING" | "COMPLETED" | "CANCELLED",
    version: number,
    extra = {},
  ) => ({
    status,
    version,
    paymentVerified: true,
    reason: "",
    reference: "",
    ...extra,
  });
  async function order(amount = "1000", trxId = "TEST-TRX-001") {
    const quote = await service.createQuote(userId, input(amount));
    return service.submitProof(userId, {
      quoteId: quote.id,
      senderAccount: "01712345678",
      trxId,
    });
  }
  it("holds reserves, snapshots rates, and replays checkout idempotently", async () => {
    const request = input();
    const q = await service.createQuote(userId, request);
    expect(
      (await db.paymentMethod.findUniqueOrThrow({ where: { id: toId } }))
        .reserve,
    ).toBe("90");
    expect((await service.createQuote(userId, request)).id).toBe(q.id);
    await db.exchangePair.updateMany({ data: { rate: "0.02" } });
    expect(
      (await db.quote.findUniqueOrThrow({ where: { id: q.id } })).receiveAmount,
    ).toBe("10.00");
  });
  it("prevents overspending under concurrent checkouts", async () => {
    const results = await Promise.allSettled([
      service.createQuote(userId, input("8000")),
      service.createQuote(userId, input("8000")),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(
      (await db.paymentMethod.findUniqueOrThrow({ where: { id: toId } }))
        .reserve,
    ).toBe("20");
  });
  it("rejects disabled pairs, precision, limits, and invalid destinations", async () => {
    await expect(service.createQuote(userId, input("1"))).rejects.toThrow();
    await expect(
      service.createQuote(userId, input("1000.001")),
    ).rejects.toThrow();
    await expect(
      service.createQuote(userId, { ...input(), destination: "invalid" }),
    ).rejects.toThrow();
    await db.exchangePair.updateMany({ data: { enabled: false } });
    await expect(service.createQuote(userId, input())).rejects.toThrow();
  });
  it("enforces transaction uniqueness and repeat submission idempotency", async () => {
    const first = await order();
    const same = await service.submitProof(userId, {
      quoteId: first.quoteId,
      senderAccount: "01712345678",
      trxId: "test-trx-001",
    });
    expect(same.id).toBe(first.id);
    await expect(order("1000", "TEST-TRX-001")).rejects.toThrow();
    expect(await db.order.count()).toBe(1);
  });
  it("enforces checkout ownership", async () => {
    const q = await service.createQuote(userId, input());
    await expect(
      service.submitProof(otherAdmin, {
        quoteId: q.id,
        senderAccount: "01712345678",
        trxId: "NO-ACCESS",
      }),
    ).rejects.toThrow("Checkout not found");
  });
  it("releases expired holds once and reviews late proof", async () => {
    const q = await service.createQuote(userId, input());
    await db.quote.update({
      where: { id: q.id },
      data: { expiresAt: new Date(0) },
    });
    await service.expireQuotes();
    await service.expireQuotes();
    expect(
      (await db.paymentMethod.findUniqueOrThrow({ where: { id: toId } }))
        .reserve,
    ).toBe("100");
    const o = await service.submitProof(userId, {
      quoteId: q.id,
      senderAccount: "01712345678",
      trxId: "LATE-TRX-001",
    });
    expect(o.reviewRequired).toBe(true);
    await service.processOrder(adminId, o.id, processInput("PROCESSING", 0));
    expect(
      (await db.paymentMethod.findUniqueOrThrow({ where: { id: toId } }))
        .reserve,
    ).toBe("90");
  });
  it("requires payment verification, locks processing to one admin, and requires payout proof", async () => {
    const o = await order();
    await expect(
      service.processOrder(
        adminId,
        o.id,
        processInput("PROCESSING", 0, { paymentVerified: false }),
      ),
    ).rejects.toThrow();
    const results = await Promise.allSettled([
      service.processOrder(adminId, o.id, processInput("PROCESSING", 0)),
      service.processOrder(otherAdmin, o.id, processInput("PROCESSING", 0)),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const current = await db.order.findUniqueOrThrow({ where: { id: o.id } });
    await expect(
      service.processOrder(
        current.processedBy!,
        o.id,
        processInput("COMPLETED", current.version),
      ),
    ).rejects.toThrow();
    const done = await service.processOrder(
      current.processedBy!,
      o.id,
      processInput("COMPLETED", current.version, { reference: "PAYOUT-001" }),
    );
    expect(done.status).toBe("COMPLETED");
    expect(
      (await db.paymentMethod.findUniqueOrThrow({ where: { id: fromId } }))
        .reserve,
    ).toBe("11000");
    expect(await db.auditEvent.count()).toBe(2);
  });
  it("requires cancellation reasons and tracks verified refunds separately", async () => {
    const o = await order();
    await expect(
      service.processOrder(adminId, o.id, processInput("CANCELLED", 0)),
    ).rejects.toThrow();
    const cancelled = await service.processOrder(
      adminId,
      o.id,
      processInput("CANCELLED", 0, {
        reason: "Customer requested cancellation",
      }),
    );
    expect(cancelled.refundStatus).toBe("PENDING");
    expect(
      (await db.paymentMethod.findUniqueOrThrow({ where: { id: fromId } }))
        .reserve,
    ).toBe("10000");
    expect(
      (await db.paymentMethod.findUniqueOrThrow({ where: { id: toId } }))
        .reserve,
    ).toBe("100");
    const refunded = await service.processOrder(
      adminId,
      o.id,
      processInput("CANCELLED", cancelled.version, {
        refundStatus: "REFUNDED",
        refundReference: "REFUND-001",
      }),
    );
    expect(refunded.refundStatus).toBe("REFUNDED");
    expect(
      (await db.paymentMethod.findUniqueOrThrow({ where: { id: fromId } }))
        .reserve,
    ).toBe("10000");
  });
  it("holds a processed payment back for refund and never debits it twice", async () => {
    const o = await order();
    const processing = await service.processOrder(
      adminId,
      o.id,
      processInput("PROCESSING", 0),
    );
    const cancelled = await service.processOrder(
      adminId,
      o.id,
      processInput("CANCELLED", processing.version, {
        reason: "Payout account unavailable",
      }),
    );
    expect(
      (await db.paymentMethod.findUniqueOrThrow({ where: { id: fromId } }))
        .reserve,
    ).toBe("10000");
    await service.processOrder(
      adminId,
      o.id,
      processInput("CANCELLED", cancelled.version, {
        refundStatus: "REFUNDED",
        refundReference: "REFUND-002",
      }),
    );
    expect(
      (await db.paymentMethod.findUniqueOrThrow({ where: { id: fromId } }))
        .reserve,
    ).toBe("10000");
    await expect(
      service.processOrder(
        adminId,
        o.id,
        processInput("CANCELLED", cancelled.version, {
          refundStatus: "REFUNDED",
          refundReference: "REFUND-002",
        }),
      ),
    ).rejects.toThrow();
  });
});
