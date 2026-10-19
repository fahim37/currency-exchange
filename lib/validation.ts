import { z } from "zod";
import Decimal from "decimal.js";
export const objectId = z.string().regex(/^[a-f\d]{24}$/i);
export const decimal = z
  .string()
  .regex(/^\d{1,14}(\.\d{1,12})?$/)
  .refine((v) => new Decimal(v).isFinite());
export const positiveDecimal = decimal.refine((v) => new Decimal(v).gt(0));
export const quoteSchema = z.object({
  fromId: objectId,
  toId: objectId,
  amount: positiveDecimal,
  destination: z.string().trim().min(3).max(200),
  requestKey: z.string().uuid(),
});
export const proofSchema = z.object({
  quoteId: objectId,
  senderAccount: z.string().trim().min(3).max(150),
  trxId: z
    .string()
    .trim()
    .min(5)
    .max(128)
    .regex(/^[a-z\d._:-]+$/i),
});
export const methodSchema = z
  .object({
    id: objectId.optional(),
    name: z.string().trim().min(2).max(30),
    slug: z.string().regex(/^[a-z0-9-]{2,30}$/),
    currency: z.enum(["BDT", "USD", "USDT"]),
    kind: z.enum(["PHONE", "EMAIL", "WALLET", "BANK"]),
    network: z.string().trim().max(30).nullable().default(null),
    color: z.string().regex(/^#[a-f\d]{6}$/i),
    decimals: z.number().int().min(0).max(6),
    reserve: decimal,
    enabled: z.boolean(),
    receivingAccount: z.string().trim().max(200),
    instructions: z.string().trim().max(1000),
    instructionsEn: z.string().trim().max(1000),
    version: z.number().int().optional(),
  })
  .superRefine((v, c) => {
    if (v.kind === "WALLET" && !v.network)
      c.addIssue({
        code: "custom",
        path: ["network"],
        message: "Wallet network is required",
      });
    if (v.currency === "USDT" && (v.kind !== "WALLET" || v.network !== "TRC20"))
      c.addIssue({
        code: "custom",
        path: ["network"],
        message: "USDT currently requires a TRC20 wallet",
      });
    if (v.enabled && !validDestination(v.kind, v.receivingAccount, v.network))
      c.addIssue({
        code: "custom",
        path: ["receivingAccount"],
        message:
          "Enter a valid receiving account for the selected method and network",
      });
    if (v.decimals !== (v.currency === "USDT" ? 6 : 2))
      c.addIssue({
        code: "custom",
        path: ["decimals"],
        message: "Use 2 decimal places for BDT/USD or 6 for USDT",
      });
  });
export const pairSchema = z
  .object({
    id: objectId.optional(),
    fromId: objectId,
    toId: objectId,
    rate: positiveDecimal,
    feePercent: decimal.refine((v) => new Decimal(v).lt(100)),
    min: positiveDecimal,
    max: positiveDecimal,
    enabled: z.boolean(),
  })
  .refine(
    (v) => v.fromId !== v.toId && new Decimal(v.max).gte(v.min),
    "Check pair and limits",
  );
export const processSchema = z.object({
  status: z.enum(["PROCESSING", "COMPLETED", "CANCELLED"]),
  version: z.number().int().min(0),
  reference: z.string().trim().max(200).default(""),
  reason: z.string().trim().max(1000).default(""),
  paymentVerified: z.boolean().default(false),
  refundStatus: z.enum(["PENDING", "REFUNDED", "NOT_REQUIRED"]).optional(),
  refundReference: z.string().trim().max(200).optional(),
});
export function validDestination(
  kind: string,
  value: string,
  network?: string | null,
) {
  if (kind === "EMAIL") return z.email().safeParse(value).success;
  if (kind === "PHONE") return /^(?:\+?88)?01[3-9]\d{8}$/.test(value);
  if (kind === "WALLET")
    return network === "TRC20" && /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(value);
  return value.length >= 6 && value.length <= 150;
}
