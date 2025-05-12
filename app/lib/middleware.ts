import { NextRequest, NextResponse } from "next/server";
import { verifyJwt } from "./jwt";
import { JWTPayload as JoseJWTPayload } from "jose";

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

export async function withAuth(
  req: Request,
  handler: (req: Request, userId: string, role: string) => Promise<Response>,
  config: MiddlewareConfig = {}
) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ success: false, message: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.split(" ")[1];

    const payload = await verifyJwt(token);

    if (!payload) {
      return new Response(
        JSON.stringify({ success: false, message: "Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const customPayload = payload as CustomJWTPayload;

    if (config.requiredRole && customPayload.role !== config.requiredRole) {
      return new Response(
        JSON.stringify({ success: false, message: "Insufficient permissions" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    return handler(req, customPayload.userId, customPayload.role);
  } catch (error) {
    console.error("Auth middleware error:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Authentication error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export function handleApiError(error: ApiError) {
  console.error("API error:", error);

  const message = error.message || "Something went wrong";
  const status = error.status || 500;

  return new Response(JSON.stringify({ success: false, message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

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

  if (path.startsWith("/blog/") || path.startsWith("/tags/")) {
    return NextResponse.next();
  }

  if (publicPaths.some((p) => path === p || path.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  const token = request.cookies.get("authToken")?.value;

  if (!token) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirect_to", path);
    return NextResponse.redirect(redirectUrl);
  }

  const payload = await verifyJwt(token);

  if (!payload) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("authToken");
    return response;
  }

  const customPayload = payload as CustomJWTPayload;

  if (
    adminPaths.some((p) => path === p || path.startsWith(p + "/")) &&
    customPayload.role !== "ADMIN"
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}
