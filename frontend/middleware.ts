import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default auth((req) => {
  const { nextUrl, auth: session } = req as NextRequest & { auth: unknown };
  const isLoggedIn = !!session;
  const path = nextUrl.pathname;

  // Profile requires auth — redirect to home if not logged in
  if (path.startsWith("/profile") && !isLoggedIn) {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  // Dashboard is accessible to everyone (demo mode for guests)
  // Individual dashboard API calls will return 401 and the UI
  // already handles the no-data fallback gracefully
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
  ],
};