import { NextResponse } from "next/server";
import { getPublicData } from "@/lib/public-data";
export async function GET() {
  return NextResponse.json(await getPublicData(), {
    headers: { "Cache-Control": "no-store" },
  });
}
