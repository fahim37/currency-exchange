import { NextResponse } from "next/server";
import {
  apiError,
  requireUser,
  checkOrigin,
  requestJson,
  ApiError,
} from "@/lib/api";
import { objectId, processSchema } from "@/lib/validation";
import { processOrder } from "@/lib/orders";
import { demoEnabled } from "@/lib/config";
export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/admin/orders/[id]">,
) {
  try {
    checkOrigin(request);
    const admin = await requireUser(true);
    if (demoEnabled())
      throw new ApiError(
        403,
        "Administration writes are disabled in demo mode.",
      );
    const { id } = await ctx.params;
    objectId.parse(id);
    return NextResponse.json(
      await processOrder(
        admin.id,
        id,
        processSchema.parse(await requestJson(request)),
      ),
    );
  } catch (e) {
    return apiError(e);
  }
}
