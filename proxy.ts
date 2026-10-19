import { NextRequest, NextResponse } from "next/server";
export function proxy(request: NextRequest) {
  const hasSession =
    request.cookies.has("better-auth.session_token") ||
    request.cookies.has("__Secure-better-auth.session_token");
  if (!hasSession) {
    if (request.nextUrl.pathname.startsWith("/api/"))
      return NextResponse.json(
        { error: "Please sign in.", errorBn: "লগ ইন করুন।" },
        { status: 401 },
      );
    const login = new URL("/login", request.url);
    login.searchParams.set(
      "next",
      request.nextUrl.pathname + request.nextUrl.search,
    );
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/orders/:path*",
    "/api/quotes/:path*",
    "/api/profile/:path*",
  ],
};
