import { NextResponse } from "next/server";
import {
  apiError,
  requireUser,
  checkOrigin,
  rateLimit,
  requestJson,
  ApiError,
} from "@/lib/api";
import { proofSchema } from "@/lib/validation";
import { submitProof } from "@/lib/orders";
import { db } from "@/lib/db";
import { demoEnabled } from "@/lib/config";
export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const query = new URL(request.url).searchParams;
    const page = Math.min(10000, Math.max(1, Number(query.get("page")) || 1));
    const search = (query.get("search") || "").slice(0, 80);
    const status = query.get("status");
    const where = {
      userId: user.id,
      ...(search
        ? { number: { contains: search, mode: "insensitive" as const } }
        : {}),
      ...(["PENDING", "PROCESSING", "COMPLETED", "CANCELLED"].includes(
        status || "",
      )
        ? { status: status! }
        : {}),
    };
    const [orders, count, groups] = await Promise.all([
      db.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * 10,
        take: 10,
      }),
      db.order.count({ where }),
      db.order.groupBy({
        by: ["status"],
        where: { userId: user.id },
        _count: true,
      }),
    ]);
    return NextResponse.json({ orders, count, page, groups });
  } catch (e) {
    return apiError(e);
  }
}
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const user = await requireUser();
    if (demoEnabled())
      throw new ApiError(403, "Real orders are disabled in demo mode.");
    await rateLimit(`proof:${user.id}`, 10);
    return NextResponse.json(
      await submitProof(user.id, proofSchema.parse(await requestJson(request))),
    );
  } catch (e) {
    return apiError(e);
  }
}
