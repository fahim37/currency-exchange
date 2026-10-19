import "server-only";
import { connection } from "next/server";
import { db } from "./db";
import { databaseConfigured, demoEnabled } from "./config";
import { demoData } from "./demo";
import { maskIdentity } from "./utils";
import { expireQuotes } from "./orders";
import type { PublicData, OrderStatus } from "./types";
export async function getPublicData(): Promise<PublicData> {
  await connection();
  if (demoEnabled()) return demoData;
  const empty: PublicData = {
    methods: [],
    pairs: [],
    activity: [],
    online: false,
    notice: "সার্ভিস কনফিগার করা হচ্ছে।",
    noticeEn: "Our exchange service is being configured.",
    serviceHours: "",
    demo: false,
    configured: false,
    acceptingOrders: false,
    completedCount: 0,
  };
  if (!databaseConfigured()) return empty;
  try {
    await expireQuotes();
    const [methods, pairs, activity, settings, completedCount] =
      await Promise.all([
        db.paymentMethod.findMany({ orderBy: { slug: "asc" } }),
        db.exchangePair.findMany(),
        db.order.findMany({
          where: { status: { in: ["PENDING", "PROCESSING", "COMPLETED"] } },
          orderBy: { createdAt: "desc" },
          take: 8,
          include: { user: { select: { email: true } } },
        }),
        db.siteSettings.findUnique({ where: { key: "main" } }),
        db.order.count({ where: { status: "COMPLETED" } }),
      ]);
    return {
      ...empty,
      configured: true,
      methods: methods.map(
        ({
          id,
          name,
          currency,
          kind,
          network,
          color,
          reserve,
          enabled,
          decimals,
        }) => ({
          id,
          name,
          currency,
          kind,
          network,
          color,
          reserve,
          enabled,
          decimals,
        }),
      ),
      pairs: pairs.map(
        ({ id, fromId, toId, rate, feePercent, min, max, enabled }) => ({
          id,
          fromId,
          toId,
          rate,
          feePercent,
          min,
          max,
          enabled,
        }),
      ),
      activity: activity.map((o) => ({
        id: o.number,
        user: maskIdentity(o.user.email),
        from: o.fromName,
        to: o.toName,
        amount: o.receiveAmount,
        currency: o.toCurrency,
        status: o.status as OrderStatus,
        createdAt: o.createdAt.toISOString(),
      })),
      online: settings?.online || false,
      acceptingOrders: settings?.acceptingOrders || false,
      notice: settings?.notice || "",
      noticeEn: settings?.noticeEn || "",
      serviceHours: settings?.serviceHours || "",
      completedCount,
    };
  } catch {
    return {
      ...empty,
      notice: "সার্ভিস সাময়িকভাবে অনুপলব্ধ।",
      noticeEn: "Service temporarily unavailable. Please check back shortly.",
    };
  }
}
