import { NextResponse } from "next/server";
import { z } from "zod";
import {
  apiError,
  requireUser,
  checkOrigin,
  requestJson,
  ApiError,
} from "@/lib/api";
import { db } from "@/lib/db";
import { objectId, validDestination } from "@/lib/validation";
export async function GET() {
  try {
    const user = await requireUser();
    const accounts = await db.savedAccount.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
      },
      accounts,
    });
  } catch (e) {
    return apiError(e);
  }
}
export async function PATCH(request: Request) {
  try {
    checkOrigin(request);
    const user = await requireUser();
    const { name } = z
      .object({ name: z.string().trim().min(2).max(60) })
      .parse(await requestJson(request));
    await db.user.update({ where: { id: user.id }, data: { name } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const user = await requireUser();
    const data = z
      .object({
        methodId: objectId,
        label: z.string().trim().min(2).max(40),
        address: z.string().trim().min(3).max(200),
      })
      .parse(await requestJson(request));
    if ((await db.savedAccount.count({ where: { userId: user.id } })) >= 10)
      throw new ApiError(400, "You can save up to ten accounts.");
    const method = await db.paymentMethod.findUnique({
      where: { id: data.methodId },
    });
    if (!method || !validDestination(method.kind, data.address, method.network))
      throw new ApiError(
        400,
        "Invalid receiving account.",
        "প্রাপকের অ্যাকাউন্ট সঠিক নয়।",
      );
    return NextResponse.json(
      await db.savedAccount.create({ data: { ...data, userId: user.id } }),
    );
  } catch (e) {
    return apiError(e);
  }
}
export async function DELETE(request: Request) {
  try {
    checkOrigin(request);
    const user = await requireUser();
    const { id } = z.object({ id: objectId }).parse(await requestJson(request));
    await db.savedAccount.deleteMany({ where: { id, userId: user.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
