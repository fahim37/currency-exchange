import { NextResponse } from "next/server";
import { apiError, requireUser, ApiError } from "@/lib/api";
import { objectId } from "@/lib/validation";
import { db } from "@/lib/db";
import { expireQuotes } from "@/lib/orders";
export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/quotes/[id]">,
) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    objectId.parse(id);
    await expireQuotes();
    const quote = await db.quote.findFirst({
      where: { id, userId: user.id },
      include: { order: { select: { id: true } } },
    });
    if (!quote) throw new ApiError(404, "Checkout not found.");
    return NextResponse.json(quote);
  } catch (e) {
    return apiError(e);
  }
}
