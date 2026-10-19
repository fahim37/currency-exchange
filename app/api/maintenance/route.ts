import { timingSafeEqual } from "node:crypto";
import { expireQuotes } from "@/lib/orders";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api";
export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET,
    provided =
      request.headers.get("authorization")?.replace(/^Bearer /, "") || "";
  if (
    !expected ||
    Buffer.byteLength(provided) !== Buffer.byteLength(expected) ||
    !timingSafeEqual(Buffer.from(provided), Buffer.from(expected))
  )
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await expireQuotes();
    await db.requestLimit.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return Response.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
