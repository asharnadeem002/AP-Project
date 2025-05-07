import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyJwt } from "./app/lib/jwt";

export function middleware(request: NextRequest) {
  // Define public paths that don't require authentication
  const publicPaths = [
    "/",
    "/login",
    "/signup",
    "/verify-email",
    "/forgot-password",
    "/reset-password",
    "/api/auth/login",
    "/api/auth/signup",
    "/api/auth/verify-email",
    "/api/auth/verify-login",
    "/api/auth/forgot-password",
    "/api/auth/reset-password",
  ];

  // Define paths that require admin role
  const adminPaths = ["/dashboard/admin", "/api/admin"];

  const path = request.nextUrl.pathname;

  // Allow access to static files and public paths
  if (
    path.startsWith("/_next") ||
    path.startsWith("/static") ||
    path.startsWith("/images") ||
    path.startsWith("/api/public") ||
    path.includes(".") || // Files with extensions
    publicPaths.some((p) => path === p || path.startsWith(p + "/"))
  ) {
    return NextResponse.next();
  }

  // Check for API routes that require authentication
  if (path.startsWith("/api/")) {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new NextResponse(
        JSON.stringify({ success: false, message: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyJwt(token);

    if (!payload) {
      return new NextResponse(
        JSON.stringify({ success: false, message: "Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check admin paths
    if (
      adminPaths.some((p) => path.startsWith(p)) &&
      payload.role !== "ADMIN"
    ) {
      return new NextResponse(
        JSON.stringify({ success: false, message: "Insufficient permissions" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    return NextResponse.next();
  }

  // For page routes
  const token = request.cookies.get("authToken")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const payload = verifyJwt(token);

  if (!payload) {
    // Clear the invalid token
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("authToken");
    return response;
  }

  // Check admin paths for page routes
  if (adminPaths.some((p) => path.startsWith(p)) && payload.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

// Configure which paths should be processed by this middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * 1. _next/static (static files)
     * 2. _next/image (image optimization files)
     * 3. favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
