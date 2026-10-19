import "server-only";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { auth } from "./auth";
import { db } from "./db";
import { databaseConfigured } from "./config";
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public bn = message,
  ) {
    super(message);
  }
}
export async function requireUser(admin = false) {
  if (!databaseConfigured())
    throw new ApiError(
      503,
      "Database setup is required.",
      "ডাটাবেস কনফিগার করতে হবে।",
    );
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new ApiError(401, "Please sign in.", "লগ ইন করুন।");
  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user || (admin && user.role !== "ADMIN"))
    throw new ApiError(
      403,
      "You do not have access.",
      "আপনার প্রবেশাধিকার নেই।",
    );
  return user;
}
export function checkOrigin(request: Request) {
  const expected = new URL(process.env.BETTER_AUTH_URL || request.url).origin;
  if (request.headers.get("origin") !== expected)
    throw new ApiError(
      403,
      "Invalid request origin.",
      "অনুরোধের উৎস সঠিক নয়।",
    );
  if (!request.headers.get("content-type")?.includes("application/json"))
    throw new ApiError(415, "JSON content is required.");
}
export function apiError(error: unknown) {
  if (error instanceof ApiError)
    return NextResponse.json(
      { error: error.message, errorBn: error.bn },
      { status: error.status },
    );
  if (error instanceof ZodError)
    return NextResponse.json(
      {
        error: "Check the form fields.",
        errorBn: "ফর্মের তথ্য যাচাই করুন।",
        fields: error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  )
    return NextResponse.json(
      {
        error: "This transaction or record already exists.",
        errorBn: "এই ট্রানজেকশন বা তথ্য ইতোমধ্যে ব্যবহৃত হয়েছে।",
      },
      { status: 409 },
    );
  console.error(
    "ExchangeHub request failed:",
    error instanceof Prisma.PrismaClientKnownRequestError
      ? error.code
      : error instanceof Error
        ? error.name
        : "UnknownError",
  );
  return NextResponse.json(
    {
      error: "Service unavailable. Please try again.",
      errorBn: "সার্ভিস সাময়িকভাবে অনুপলব্ধ। আবার চেষ্টা করুন।",
    },
    { status: 503 },
  );
}
export async function requestJson(request: Request) {
  const text = await request.text();
  if (text.length > 16000) throw new ApiError(413, "Request too large.");
  try {
    return JSON.parse(text);
  } catch {
    throw new ApiError(400, "Invalid JSON request.");
  }
}
export async function transaction<T>(
  work: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      return await db.$transaction(work, { maxWait: 5000, timeout: 15000 });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        ["P2034", "P2028"].includes(error.code) &&
        attempt < 3
      )
        continue;
      throw error;
    }
  }
  throw new ApiError(409, "Concurrent update. Try again.");
}
export async function rateLimit(key: string, max = 10, seconds = 60) {
  const window = Math.floor(Date.now() / (seconds * 1000));
  const entry = await db.requestLimit.upsert({
    where: { key: `${key}:${window}` },
    create: {
      key: `${key}:${window}`,
      count: 1,
      expiresAt: new Date((window + 1) * seconds * 1000),
    },
    update: { count: { increment: 1 } },
  });
  if (entry.count > max)
    throw new ApiError(
      429,
      "Too many requests. Please wait.",
      "অনেক অনুরোধ হয়েছে। একটু অপেক্ষা করুন।",
    );
}
