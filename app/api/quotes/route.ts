import { NextResponse } from "next/server";
import {
  apiError,
  requireUser,
  checkOrigin,
  rateLimit,
  requestJson,
  ApiError,
} from "@/lib/api";
import { quoteSchema } from "@/lib/validation";
import { createQuote } from "@/lib/orders";
import { demoEnabled } from "@/lib/config";
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const user = await requireUser();
    if (demoEnabled())
      throw new ApiError(403, "Real orders are disabled in demo mode.");
    await rateLimit(`quote:${user.id}`, 6, 60);
    if (!user.emailVerified)
      throw new ApiError(
        403,
        "Verify your email first.",
        "আগে ইমেইল যাচাই করুন।",
      );
    const quote = await createQuote(
      user.id,
      quoteSchema.parse(await requestJson(request)),
    );
    return NextResponse.json(quote);
  } catch (e) {
    return apiError(e);
  }
}
