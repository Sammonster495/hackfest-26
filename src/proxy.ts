import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const normalizedPath = pathname.replace(/\/$/, "");

  if (normalizedPath === "/dashboard/login") {
    return NextResponse.next();
  }

  if (normalizedPath.startsWith("/api/auth/dashboard")) {
    return NextResponse.next();
  }

  if (normalizedPath.startsWith("/dashboard")) {
    const sessionCookie = request.cookies.get("authjs.session-token");

    if (!sessionCookie) {
      return NextResponse.redirect(new URL("/dashboard/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
