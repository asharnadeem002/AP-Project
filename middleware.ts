import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyJwt } from "./app/lib/jwt";

export async function middleware(request: NextRequest) {
  const publicPaths = [
    "/login",
    "/signup",
    "/verify-email",
    "/forgot-password",
    "/reset-password",
    "/api/auth/login",
    "/api/auth/signup",
    "/api/auth/verify-email",
    "/api/auth/verify-login",
    "/api/auth/logout",
    "/api/auth/forgot-password",
    "/api/auth/reset-password",
    "/request-reactivation",
    "/api/users/request-reactivation",
  ];
  const adminPaths = ["/dashboard/admin", "/api/admin"];
  const userPaths = ["/dashboard/user"];

  const path = request.nextUrl.pathname;

  if (path === "/") {
    const token = request.cookies.get("authToken")?.value;

    if (!token) {
      return NextResponse.next();
    }

    try {
      const payload = await verifyJwt(token);

      if (payload) {
        if (payload.role === "ADMIN") {
          return NextResponse.redirect(
            new URL("/dashboard/admin", request.url)
          );
        } else if (payload.role === "USER") {
          return NextResponse.redirect(new URL("/dashboard/user", request.url));
        }
      }
    } catch {
      return NextResponse.next();
    }
  }

  if (
    path.startsWith("/_next") ||
    path.startsWith("/static") ||
    path.startsWith("/images") ||
    path.startsWith("/api/public") ||
    path.includes(".") ||
    path === "/request-reactivation" ||
    publicPaths.some((p) => path === p || path.startsWith(p + "/"))
  ) {
    return NextResponse.next();
  }

  if (path.startsWith("/api/")) {
    const authHeader = request.headers.get("authorization");
    let token: string | null = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    if (!token) {
      token = request.cookies.get("authToken")?.value ?? null;
    }

    if (!token) {
      return new NextResponse(
        JSON.stringify({ success: false, message: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const payload = await verifyJwt(token);

    if (!payload) {
      return new NextResponse(
        JSON.stringify({ success: false, message: "Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check if user is deactivated (for non-admin users)
    if (payload.role !== "ADMIN" && payload.isActive === false) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          message:
            "Your account has been deactivated. Please contact support or request reactivation.",
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    if (
      adminPaths.some((p) => path.startsWith(p)) &&
      payload.role !== "ADMIN"
    ) {
      return new NextResponse(
        JSON.stringify({ success: false, message: "Insufficient permissions" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    if (userPaths.some((p) => path.startsWith(p)) && payload.role !== "USER") {
      return new NextResponse(
        JSON.stringify({ success: false, message: "Insufficient permissions" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    return NextResponse.next();
  }

  const token = request.cookies.get("authToken")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const payload = await verifyJwt(token);

  if (!payload) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("authToken");
    return response;
  }

  // Redirect deactivated users to reactivation page
  if (payload.role !== "ADMIN" && payload.isActive === false) {
    return NextResponse.redirect(new URL("/request-reactivation", request.url));
  }

  if (adminPaths.some((p) => path.startsWith(p)) && payload.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (userPaths.some((p) => path.startsWith(p)) && payload.role !== "USER") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|_next/data|favicon.ico).*)",
    "/api/:path*",
  ],
};
