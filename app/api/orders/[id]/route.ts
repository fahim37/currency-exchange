import { NextResponse } from "next/server";
import { apiError, requireUser, ApiError } from "@/lib/api";
import { db } from "@/lib/db";
import { objectId } from "@/lib/validation";
export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/orders/[id]">,
) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    objectId.parse(id);
    const order = await db.order.findFirst({
      where: { id, userId: user.id },
      include: { quote: { select: { toNetwork: true } } },
    });
    if (!order) throw new ApiError(404, "Order not found.");
    return NextResponse.json(order);
  } catch (e) {
    return apiError(e);
  }
}
