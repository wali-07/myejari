import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySession } from "@/lib/admin/auth";

/**
 * Auth gate for the admin app. Every /admin/* path requires a valid signed
 * session cookie EXCEPT /admin/login, which is the unauthenticated landing
 * page where credentials are submitted.
 *
 * Runs in the Edge runtime — uses Web Crypto for HMAC verification.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Login page is the only public admin path.
  if (pathname === "/admin/login") return NextResponse.next();

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const email = await verifySession(token);

  if (!email) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("from", pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Match every admin path. /api/admin/login is intentionally NOT gated —
  // that's where credentials are submitted to obtain a session.
  matcher: ["/admin/:path*"],
};
