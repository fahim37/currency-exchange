import { describe, expect, it } from "vitest";
import { calculateExchange, normalizeTrxId } from "../lib/exchange-math";
import {
  methodSchema,
  pairSchema,
  proofSchema,
  validDestination,
} from "../lib/validation";
describe("exchange calculations", () => {
  it("calculates without binary floating-point drift", () => {
    expect(calculateExchange("0.3", "0.1", "0", 6).receive).toBe("0.030000");
  });
  it("deducts a transparent percentage fee and rounds payouts down", () => {
    const result = calculateExchange("1000", "0.0081", "1.5", 2);
    expect(result.fee).toBe("15");
    expect(result.receive).toBe("7.97");
  });
  it("rejects non-positive, infinite, and invalid rates and amounts", () => {
    for (const v of ["0", "-1", "NaN", "Infinity"])
      expect(() => calculateExchange(v, "1", "0")).toThrow();
    expect(() => calculateExchange("1", "0", "0")).toThrow();
    expect(() => calculateExchange("1", "1", "100")).toThrow();
  });
  it("normalizes transaction identifiers consistently", () => {
    expect(normalizeTrxId("  abC123 ")).toBe("ABC123");
    expect(
      proofSchema.safeParse({
        quoteId: "a".repeat(24),
        senderAccount: "01712345678",
        trxId: "<script>",
      }).success,
    ).toBe(false);
  });
});
describe("account and pair validation", () => {
  it("validates Bangladesh phones, emails, and exact TRC20 network", () => {
    expect(validDestination("PHONE", "01712345678")).toBe(true);
    expect(validDestination("PHONE", "123")).toBe(false);
    expect(validDestination("EMAIL", "test@example.com")).toBe(true);
    expect(validDestination("EMAIL", "broken")).toBe(false);
    const address = "T" + "A".repeat(33);
    expect(validDestination("WALLET", address, "TRC20")).toBe(true);
    expect(validDestination("WALLET", address, "ERC20")).toBe(false);
  });
  it("requires a receiving account before enabling a method", () => {
    expect(
      methodSchema.safeParse({
        name: "bKash",
        slug: "bkash",
        currency: "BDT",
        kind: "PHONE",
        color: "#e2136e",
        decimals: 2,
        reserve: "100",
        enabled: true,
        receivingAccount: "",
        instructions: "",
        instructionsEn: "",
      }).success,
    ).toBe(false);
  });
  it("rejects a same-method pair and inverted limits", () => {
    const pair = {
      fromId: "a".repeat(24),
      toId: "b".repeat(24),
      rate: "1",
      feePercent: "0",
      min: "10",
      max: "100",
      enabled: true,
    };
    expect(pairSchema.safeParse(pair).success).toBe(true);
    expect(pairSchema.safeParse({ ...pair, toId: pair.fromId }).success).toBe(
      false,
    );
    expect(pairSchema.safeParse({ ...pair, min: "101" }).success).toBe(false);
  });
});
