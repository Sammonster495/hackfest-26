import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userAgent = request.headers.get("user-agent")?.toLowerCase() || "";
  if (userAgent.includes("postman") || userAgent.includes("curl")) {
    return new NextResponse(
      JSON.stringify({ error: "Access Denied: Unsupported Client" }),
      {
        status: 403,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const origin = request.headers.get("origin");
  const host =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    "";

  if (!pathname.includes("razorpay")) {
    if (origin) {
      try {
        const originHost = new URL(origin).host;
        if (originHost !== host) {
        return new NextResponse(
            JSON.stringify({
              error: "Access Denied: Cross-Origin Requests Not Allowed",
            }),
            {
              status: 403,
              headers: { "Content-Type": "application/json" },
            },
          );
        }
      } catch {
        return new NextResponse(
          JSON.stringify({ error: "Access Denied: Invalid Origin" }),
          {
            status: 403,
            headers: { "Content-Type": "application/json" },
          },
        );
      }
    } else if (
      pathname.startsWith("/api") &&
      ["POST", "PUT", "DELETE", "PATCH"].includes(request.method.toUpperCase())
    ) {
      return new NextResponse(
        JSON.stringify({ error: "Access Denied: Missing Origin" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  }

  const normalizedPath = pathname.replace(/\/$/, "");

  if (
    normalizedPath === "/dashboard/login" ||
    normalizedPath === "/dashboard/signup"
  ) {
    return NextResponse.next();
  }

  if (normalizedPath.startsWith("/api/auth/dashboard")) {
    return NextResponse.next();
  }

  if (normalizedPath.startsWith("/dashboard")) {
    const sessionCookie =
      request.cookies.get("dashboard.session-token") ||
      request.cookies.get("__Secure-dashboard.session-token");
    if (!sessionCookie) {
      return NextResponse.redirect(new URL("/dashboard/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
