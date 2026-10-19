"use client";
export class ClientError extends Error {
  constructor(
    message: string,
    public messageBn: string,
    public status: number,
    public fields?: Record<string, string[]>,
  ) {
    super(message);
  }
}
export async function api<T>(
  url: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const response = await fetch(url, {
    method,
    headers:
      body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok)
    throw new ClientError(
      data.error || data.message || "Request failed. Please retry.",
      data.errorBn ||
        "অনুরোধটি সম্পন্ন হয়নি। তথ্য যাচাই করে আবার চেষ্টা করুন।",
      response.status,
      data.fields,
    );
  return data;
}
export function errorText(error: unknown, locale: string) {
  return error instanceof ClientError
    ? locale === "bn"
      ? error.messageBn
      : error.message
    : locale === "bn"
      ? "সংযোগে সমস্যা হচ্ছে। আবার চেষ্টা করুন।"
      : "Connection interrupted. Please try again.";
}
