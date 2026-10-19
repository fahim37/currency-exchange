import { NextResponse } from "next/server";
import { z } from "zod";
import {
  apiError,
  ApiError,
  requireUser,
  checkOrigin,
  requestJson,
  transaction,
} from "@/lib/api";
import { db } from "@/lib/db";
import { objectId, methodSchema, pairSchema } from "@/lib/validation";
import { expireQuotes } from "@/lib/orders";
import { demoEnabled } from "@/lib/config";

export async function GET(
  request: Request,
  ctx: RouteContext<"/api/admin/[resource]">,
) {
  try {
    await requireUser(true);
    const { resource } = await ctx.params;
    const query = new URL(request.url).searchParams;
    const page = Math.max(1, Math.min(10000, Number(query.get("page")) || 1));
    const search = (query.get("search") || "").slice(0, 80),
      status = query.get("status");
    if (resource === "overview") {
      await expireQuotes();
      const [groups, methods, recent, refunds] = await Promise.all([
        db.order.groupBy({ by: ["status"], _count: true }),
        db.paymentMethod.findMany({ orderBy: { slug: "asc" } }),
        db.order.findMany({
          where: { status: "PENDING" },
          orderBy: { createdAt: "asc" },
          take: 10,
          include: {
            user: { select: { name: true, email: true } },
            quote: true,
          },
        }),
        db.order.count({ where: { refundStatus: "PENDING" } }),
      ]);
      return NextResponse.json({ groups, methods, recent, refunds });
    }
    if (resource === "orders") {
      const where = {
        ...(search
          ? {
              OR: [
                { number: { contains: search, mode: "insensitive" as const } },
                {
                  paymentTrxId: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
              ],
            }
          : {}),
        ...(["PENDING", "PROCESSING", "COMPLETED", "CANCELLED"].includes(
          status || "",
        )
          ? { status: status! }
          : {}),
        ...(query.get("refund") === "PENDING"
          ? { refundStatus: "PENDING" }
          : {}),
      };
      const userId = query.get("user");
      const filteredWhere = userId
        ? { ...where, userId: objectId.parse(userId) }
        : where;
      const [orders, count] = await Promise.all([
        db.order.findMany({
          where: filteredWhere,
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * 10,
          take: 10,
          include: {
            user: { select: { name: true, email: true } },
            quote: true,
          },
        }),
        db.order.count({ where: filteredWhere }),
      ]);
      return NextResponse.json({ orders, count, page });
    }
    if (resource === "methods")
      return NextResponse.json(
        await db.paymentMethod.findMany({ orderBy: { slug: "asc" } }),
      );
    if (resource === "rates")
      return NextResponse.json({
        pairs: await db.exchangePair.findMany(),
        methods: await db.paymentMethod.findMany({ orderBy: { slug: "asc" } }),
      });
    if (resource === "settings")
      return NextResponse.json(
        (await db.siteSettings.findUnique({ where: { key: "main" } })) || {
          online: false,
          acceptingOrders: false,
          notice: "",
          noticeEn: "",
          serviceHours: "",
        },
      );
    if (resource === "users") {
      const where = search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { email: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {};
      const [users, count] = await Promise.all([
        db.user.findMany({
          where,
          skip: (page - 1) * 10,
          take: 10,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            email: true,
            emailVerified: true,
            role: true,
            createdAt: true,
            _count: { select: { orders: true } },
          },
        }),
        db.user.count({ where }),
      ]);
      return NextResponse.json({ users, count, page });
    }
    if (resource === "audit")
      return NextResponse.json({
        events: await db.auditEvent.findMany({
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * 20,
          take: 20,
        }),
        count: await db.auditEvent.count(),
        page,
      });
    throw new ApiError(404, "Resource not found.");
  } catch (e) {
    return apiError(e);
  }
}

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/admin/[resource]">,
) {
  try {
    checkOrigin(request);
    const admin = await requireUser(true);
    const { resource } = await ctx.params;
    if (demoEnabled())
      throw new ApiError(
        403,
        "Administration writes are disabled in demo mode.",
      );
    const body = await requestJson(request);
    const result = await transaction(async (tx) => {
      let targetId = "main";
      if (resource === "methods") {
        const { id, version, ...data } = methodSchema.parse(body);
        if (id) {
          if (version === undefined)
            throw new ApiError(400, "Method version is required.");
          const changed = await tx.paymentMethod.updateMany({
            where: { id, version },
            data: { ...data, version: { increment: 1 } },
          });
          if (!changed.count)
            throw new ApiError(
              409,
              "Reserve changed. Reload before saving.",
              "রিজার্ভ পরিবর্তিত হয়েছে। রিফ্রেশ করে সেভ করুন।",
            );
          targetId = id;
        } else targetId = (await tx.paymentMethod.create({ data })).id;
      } else if (resource === "rates") {
        const { id, ...data } = pairSchema.parse(body);
        const methods = await tx.paymentMethod.count({
          where: { id: { in: [data.fromId, data.toId] } },
        });
        if (methods !== 2)
          throw new ApiError(400, "Both payment methods must exist.");
        targetId = id
          ? (await tx.exchangePair.update({ where: { id }, data })).id
          : (await tx.exchangePair.create({ data })).id;
      } else if (resource === "settings") {
        const data = z
          .object({
            online: z.boolean(),
            acceptingOrders: z.boolean(),
            notice: z.string().trim().max(500),
            noticeEn: z.string().trim().max(500),
            serviceHours: z.string().trim().max(150),
          })
          .parse(body);
        if (data.acceptingOrders) {
          const methods = await tx.paymentMethod.findMany({
            where: {
              enabled: true,
              receivingAccount: { not: "" },
              reserve: { not: "0" },
            },
          });
          const pairs = await tx.exchangePair.count({
            where: {
              enabled: true,
              fromId: { in: methods.map((m) => m.id) },
              toId: { in: methods.map((m) => m.id) },
            },
          });
          if (!pairs)
            throw new ApiError(
              400,
              "Configure active payment accounts, reserves, and a rate pair before accepting orders.",
              "অর্ডার চালুর আগে সক্রিয় অ্যাকাউন্ট, রিজার্ভ ও রেট কনফিগার করুন।",
            );
        }
        await tx.siteSettings.upsert({
          where: { key: "main" },
          create: { ...data, key: "main" },
          update: data,
        });
      } else throw new ApiError(404, "Resource not found.");
      // Deliberately omit receiving account details from the audit payload.
      await tx.auditEvent.create({
        data: {
          actorId: admin.id,
          action: `${resource.toUpperCase()}_SAVED`,
          targetId,
          details: {
            resource,
            ...(resource === "methods"
              ? { reserve: body.reserve, enabled: body.enabled }
              : resource === "rates"
                ? {
                    rate: body.rate,
                    feePercent: body.feePercent,
                    enabled: body.enabled,
                  }
                : {
                    online: body.online,
                    acceptingOrders: body.acceptingOrders,
                  }),
          },
        },
      });
      return { ok: true, id: targetId };
    });
    return NextResponse.json(result);
  } catch (e) {
    return apiError(e);
  }
}
