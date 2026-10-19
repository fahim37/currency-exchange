import "server-only";
import { randomBytes } from "node:crypto";
import Decimal from "decimal.js";
import { Prisma } from "@prisma/client";
import { db } from "./db";
import { ApiError, transaction } from "./api";
import { calculateExchange, normalizeTrxId } from "./exchange-math";
import {
  proofSchema,
  quoteSchema,
  processSchema,
  validDestination,
} from "./validation";
import { siteConfig } from "./config";
import type { z } from "zod";

export async function adjustReserve(
  tx: Prisma.TransactionClient,
  id: string,
  delta: string,
) {
  const method = await tx.paymentMethod.findUniqueOrThrow({ where: { id } });
  const next = new Decimal(method.reserve).plus(delta);
  if (next.lt(0))
    throw new ApiError(
      409,
      "Insufficient available reserve.",
      "পর্যাপ্ত রিজার্ভ নেই।",
    );
  const changed = await tx.paymentMethod.updateMany({
    where: { id, version: method.version },
    data: { reserve: next.toFixed(), version: { increment: 1 } },
  });
  if (!changed.count)
    throw new ApiError(
      409,
      "Reserve changed. Please retry.",
      "রিজার্ভ পরিবর্তিত হয়েছে। আবার চেষ্টা করুন।",
    );
}

export async function expireQuotes() {
  const expired = await db.quote.findMany({
    where: { state: "HELD", expiresAt: { lte: new Date() } },
    select: { id: true },
    take: 100,
  });
  for (const { id } of expired)
    await transaction(async (tx) => {
      const quote = await tx.quote.findUnique({ where: { id } });
      if (!quote || quote.state !== "HELD" || quote.expiresAt > new Date())
        return;
      const changed = await tx.quote.updateMany({
        where: { id, state: "HELD" },
        data: { state: "EXPIRED", reserved: false },
      });
      if (changed.count && quote.reserved)
        await adjustReserve(tx, quote.toId, quote.receiveAmount);
    });
}

export async function createQuote(
  userId: string,
  input: z.infer<typeof quoteSchema>,
) {
  await expireQuotes();
  return transaction(async (tx) => {
    const previous = await tx.quote.findUnique({
      where: { requestKey: input.requestKey },
    });
    if (previous) {
      if (
        previous.userId !== userId ||
        previous.fromId !== input.fromId ||
        previous.toId !== input.toId ||
        !new Decimal(previous.sendAmount).eq(input.amount) ||
        previous.destination !== input.destination
      )
        throw new ApiError(409, "Checkout key already used.");
      return previous;
    }
    const settings = await tx.siteSettings.findUnique({
      where: { key: "main" },
    });
    if (!settings?.acceptingOrders || !settings.online)
      throw new ApiError(
        409,
        "The service is currently closed for new exchanges.",
        "বর্তমানে নতুন এক্সচেঞ্জ গ্রহণ বন্ধ।",
      );
    const active = await tx.quote.count({ where: { userId, state: "HELD" } });
    if (active >= 3)
      throw new ApiError(
        429,
        "You already have three active checkouts. Finish one or wait for expiry.",
        "তিনটি চেকআউট চালু আছে। একটি শেষ করুন বা মেয়াদ শেষ হওয়া পর্যন্ত অপেক্ষা করুন।",
      );
    const [from, to, pair] = await Promise.all([
      tx.paymentMethod.findUnique({ where: { id: input.fromId } }),
      tx.paymentMethod.findUnique({ where: { id: input.toId } }),
      tx.exchangePair.findUnique({
        where: { fromId_toId: { fromId: input.fromId, toId: input.toId } },
      }),
    ]);
    if (
      !from?.enabled ||
      !to?.enabled ||
      !pair?.enabled ||
      !from.receivingAccount
    )
      throw new ApiError(
        409,
        "This exchange pair is not available.",
        "এই এক্সচেঞ্জ পেয়ার উপলব্ধ নয়।",
      );
    if (!validDestination(to.kind, input.destination, to.network))
      throw new ApiError(
        400,
        "Check the destination account and network.",
        "প্রাপকের অ্যাকাউন্ট ও নেটওয়ার্ক যাচাই করুন।",
      );
    const amount = new Decimal(input.amount);
    if (
      amount.decimalPlaces() > from.decimals ||
      amount.lt(pair.min) ||
      amount.gt(pair.max)
    )
      throw new ApiError(
        400,
        "Amount is outside the allowed limits or precision.",
        "পরিমাণ নির্ধারিত সীমা বা দশমিকের বাইরে।",
      );
    const result = calculateExchange(
      input.amount,
      pair.rate,
      pair.feePercent,
      to.decimals,
    );
    if (new Decimal(result.receive).lte(0))
      throw new ApiError(400, "The received amount is too small.");
    await adjustReserve(
      tx,
      to.id,
      new Decimal(result.receive).negated().toFixed(),
    );
    return tx.quote.create({
      data: {
        userId,
        requestKey: input.requestKey,
        fromId: from.id,
        toId: to.id,
        fromName: from.name,
        toName: to.name,
        fromCurrency: from.currency,
        toCurrency: to.currency,
        toNetwork: to.network,
        sendAmount: result.send,
        receiveAmount: result.receive,
        fee: result.fee,
        rate: result.rate,
        destination: input.destination,
        receivingAccount: from.receivingAccount,
        instructions: from.instructions,
        instructionsEn: from.instructionsEn,
        expiresAt: new Date(Date.now() + siteConfig.quoteMinutes * 60000),
      },
    });
  });
}

export async function submitProof(
  userId: string,
  input: z.infer<typeof proofSchema>,
) {
  return transaction(async (tx) => {
    const quote = await tx.quote.findUnique({ where: { id: input.quoteId } });
    if (!quote || quote.userId !== userId)
      throw new ApiError(404, "Checkout not found.", "চেকআউট পাওয়া যায়নি।");
    const trxId = normalizeTrxId(input.trxId);
    const existing = await tx.order.findUnique({
      where: { quoteId: quote.id },
    });
    if (existing) {
      if (
        existing.paymentTrxId === trxId &&
        existing.senderAccount === input.senderAccount
      )
        return existing;
      throw new ApiError(
        409,
        "Payment proof has already been submitted for this checkout.",
        "এই চেকআউটে পেমেন্ট প্রমাণ জমা দেওয়া হয়েছে।",
      );
    }
    if (!["HELD", "EXPIRED"].includes(quote.state))
      throw new ApiError(409, "Checkout is no longer available.");
    const from = await tx.paymentMethod.findUniqueOrThrow({
      where: { id: quote.fromId },
    });
    if (!validDestination(from.kind, input.senderAccount, from.network))
      throw new ApiError(
        400,
        "Check your sending account.",
        "প্রেরকের অ্যাকাউন্ট যাচাই করুন।",
      );
    const late = quote.expiresAt <= new Date() || quote.state === "EXPIRED";
    if (late && quote.reserved)
      await adjustReserve(tx, quote.toId, quote.receiveAmount);
    await tx.quote.update({
      where: { id: quote.id },
      data: { state: "SUBMITTED", reserved: !late && quote.reserved },
    });
    return tx.order.create({
      data: {
        number: `EH-${randomBytes(5).toString("hex").toUpperCase()}`,
        userId,
        quoteId: quote.id,
        fromName: quote.fromName,
        toName: quote.toName,
        fromCurrency: quote.fromCurrency,
        toCurrency: quote.toCurrency,
        sendAmount: quote.sendAmount,
        receiveAmount: quote.receiveAmount,
        fee: quote.fee,
        rate: quote.rate,
        destination: quote.destination,
        senderAccount: input.senderAccount,
        paymentTrxId: trxId,
        reviewRequired: late,
      },
    });
  });
}

export async function processOrder(
  adminId: string,
  id: string,
  input: z.infer<typeof processSchema>,
) {
  return transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id },
      include: { quote: true },
    });
    if (!order) throw new ApiError(404, "Order not found.");
    if (order.version !== input.version)
      throw new ApiError(
        409,
        "Order changed. Refresh before continuing.",
        "অর্ডার পরিবর্তিত হয়েছে। রিফ্রেশ করুন।",
      );
    if (order.status === "COMPLETED")
      throw new ApiError(409, "Completed orders cannot be changed.");
    if (order.status === "PROCESSING" && order.processedBy !== adminId)
      throw new ApiError(
        409,
        "This order is assigned to another administrator.",
        "এই অর্ডার অন্য অ্যাডমিন প্রসেস করছেন।",
      );
    let data: Prisma.OrderUpdateManyMutationInput;
    if (order.status === "CANCELLED") {
      if (
        order.refundStatus !== "PENDING" ||
        input.refundStatus !== "REFUNDED" ||
        !input.refundReference ||
        input.status !== "CANCELLED"
      )
        throw new ApiError(
          400,
          "A pending refund and refund reference are required.",
        );
      // Funds were removed from available reserve when the refund was opened.
      data = {
        refundStatus: "REFUNDED",
        refundReference: input.refundReference,
      };
    } else if (input.status === "PROCESSING") {
      if (order.status !== "PENDING" || !input.paymentVerified)
        throw new ApiError(
          400,
          "Verify payment before processing.",
          "প্রসেস করার আগে পেমেন্ট যাচাই করুন।",
        );
      if (!order.quote.reserved) {
        await adjustReserve(
          tx,
          order.quote.toId,
          new Decimal(order.receiveAmount).negated().toFixed(),
        );
        await tx.quote.update({
          where: { id: order.quoteId },
          data: { reserved: true },
        });
      }
      await adjustReserve(tx, order.quote.fromId, order.sendAmount);
      data = {
        status: "PROCESSING",
        paymentVerified: true,
        reviewRequired: false,
        processedBy: adminId,
      };
    } else if (input.status === "COMPLETED") {
      if (
        order.status !== "PROCESSING" ||
        !order.paymentVerified ||
        !input.reference
      )
        throw new ApiError(
          400,
          "Processing and a payout reference are required.",
          "প্রসেসিং স্ট্যাটাস ও পেআউট রেফারেন্স প্রয়োজন।",
        );
      data = { status: "COMPLETED", payoutReference: input.reference };
    } else {
      if (input.reason.length < 5)
        throw new ApiError(
          400,
          "Enter a cancellation reason.",
          "বাতিল করার কারণ লিখুন।",
        );
      const paid = order.paymentVerified || input.paymentVerified;
      // Keep funds owed back to the customer unavailable to new exchanges.
      // A payment cancelled before processing was never credited to reserve.
      if (order.paymentVerified)
        await adjustReserve(
          tx,
          order.quote.fromId,
          new Decimal(order.sendAmount).negated().toFixed(),
        );
      if (order.quote.reserved) {
        await adjustReserve(tx, order.quote.toId, order.receiveAmount);
        await tx.quote.update({
          where: { id: order.quoteId },
          data: { reserved: false },
        });
      }
      data = {
        status: "CANCELLED",
        cancellationReason: input.reason,
        paymentVerified: paid,
        refundStatus: paid ? "PENDING" : "NOT_REQUIRED",
        processedBy: adminId,
      };
    }
    const updated = await tx.order.updateMany({
      where: { id, version: input.version },
      data: { ...data, version: { increment: 1 } },
    });
    if (!updated.count)
      throw new ApiError(409, "Concurrent update. Refresh the order.");
    await tx.auditEvent.create({
      data: {
        actorId: adminId,
        action: `ORDER_${input.status}${data.refundStatus === "REFUNDED" ? "_REFUNDED" : ""}`,
        targetId: id,
        details: {
          previousStatus: order.status,
          status: input.status,
          paymentVerified: input.paymentVerified,
          reason: input.reason,
          reference: input.reference,
          refundReference: input.refundReference || "",
        },
      },
    });
    return tx.order.findUniqueOrThrow({ where: { id } });
  });
}
