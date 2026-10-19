import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";
import { apiError, ApiError } from "@/lib/api";
import { databaseConfigured } from "@/lib/config";
import { mailConfigured } from "@/lib/mail";
const handlers = toNextJsHandler(auth);
export async function GET(request: Request) {
  if (
    !databaseConfigured() &&
    new URL(request.url).pathname.endsWith("/get-session")
  )
    return Response.json(null);
  try {
    if (!databaseConfigured())
      throw new ApiError(
        503,
        "Database setup is required.",
        "ডাটাবেস কনফিগার করতে হবে।",
      );
    return await handlers.GET(request);
  } catch (e) {
    return apiError(e);
  }
}
export async function POST(request: Request) {
  try {
    if (!databaseConfigured())
      throw new ApiError(
        503,
        "Database setup is required.",
        "ডাটাবেস কনফিগার করতে হবে।",
      );
    if (
      !mailConfigured() &&
      /sign-up|request-password-reset|send-verification/.test(
        new URL(request.url).pathname,
      )
    )
      throw new ApiError(
        503,
        "Email service setup is required.",
        "ইমেইল সার্ভিস কনফিগার করতে হবে।",
      );
    return await handlers.POST(request);
  } catch (e) {
    return apiError(e);
  }
}
