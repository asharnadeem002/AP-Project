import { NextRequest, NextResponse } from "next/server";
import { verifyJwt } from "./jwt";
import { JWTPayload as JoseJWTPayload } from "jose";

// Types
export type MiddlewareConfig = {
  requiredRole?: "USER" | "ADMIN";
};

interface ApiError extends Error {
  status?: number;
}

interface CustomJWTPayload extends JoseJWTPayload {
  userId: string;
  role: "USER" | "ADMIN";
}

// API route handler middleware
export async function withAuth(
  req: Request,
  handler: (req: Request, userId: string, role: string) => Promise<Response>,
  config: MiddlewareConfig = {}
) {
  try {
    // Get the authorization header
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ success: false, message: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Extract the token
    const token = authHeader.split(" ")[1];

    // Verify the token
    const payload = await verifyJwt(token);

    if (!payload) {
      return new Response(
        JSON.stringify({ success: false, message: "Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const customPayload = payload as CustomJWTPayload;

    // Check role if required
    if (config.requiredRole && customPayload.role !== config.requiredRole) {
      return new Response(
        JSON.stringify({ success: false, message: "Insufficient permissions" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // Call the handler with the authenticated user's ID and role
    return handler(req, customPayload.userId, customPayload.role);
  } catch (error) {
    console.error("Auth middleware error:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Authentication error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// Helper function to handle errors consistently in API routes
export function handleApiError(error: ApiError) {
  console.error("API error:", error);

  const message = error.message || "Something went wrong";
  const status = error.status || 500;

  return new Response(JSON.stringify({ success: false, message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Middleware for NextJS app router navigation
export async function authMiddleware(request: NextRequest) {
  const publicPaths = [
    "/",
    "/login",
    "/signup",
    "/verify-email",
    "/forgot-password",
    "/reset-password",
    "/blog",
    "/explore",
    "/tags",
    // Add other public paths here
  ];

  const adminPaths = [
    "/dashboard/admin",
    "/dashboard/admin/users",
    "/dashboard/admin/pending-users",
    "/dashboard/admin/subscriptions",
    "/dashboard/admin/analytics",
    "/dashboard/admin/settings",
    "/dashboard/admin/blog",
    "/dashboard/admin/blog/create",
    "/dashboard/admin/blog/edit",
  ];

  const path = request.nextUrl.pathname;

  // Handle public blog posts, tag pages, etc.
  if (path.startsWith("/blog/") || path.startsWith("/tags/")) {
    return NextResponse.next();
  }

  // Allow access to public paths
  if (publicPaths.some((p) => path === p || path.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  // Check authentication for protected routes
  const token = request.cookies.get("authToken")?.value;

  if (!token) {
    const redirectUrl = new URL("/login", request.url);
    // Add a redirect_to parameter to redirect back after login
    redirectUrl.searchParams.set("redirect_to", path);
    return NextResponse.redirect(redirectUrl);
  }

  // Verify the token
  const payload = await verifyJwt(token);

  if (!payload) {
    // Clear the invalid token
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("authToken");
    return response;
  }

  const customPayload = payload as CustomJWTPayload;

  // Check admin routes
  if (
    adminPaths.some((p) => path === p || path.startsWith(p + "/")) &&
    customPayload.role !== "ADMIN"
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}
