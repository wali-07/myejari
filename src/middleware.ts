import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySession } from "@/lib/admin/auth";

/**
 * Auth gate for the admin app. Every /admin/* path AND every /api/admin/*
 * endpoint requires a valid signed session cookie — the only exceptions
 * are the login page and the login endpoint, which is where credentials
 * are submitted to obtain a session.
 *
 * Gating /api/admin/* matters: those endpoints upload, read, and migrate
 * customer documents (trade licenses, wholesaler invoices). Without this
 * they would be callable by anyone.
 *
 * Runs in the Edge runtime — uses Web Crypto for HMAC verification.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // The login page and the login endpoint are the only public admin paths.
  if (pathname === "/admin/login" || pathname === "/api/admin/login") {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const email = await verifySession(token);

  if (!email) {
    // API calls get a clean 401; page navigations are sent to login.
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("from", pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Match every admin page and every admin API route. The two /…/login
  // paths are allowed through in the handler above.
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
