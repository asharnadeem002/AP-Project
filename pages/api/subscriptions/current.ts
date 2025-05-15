import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../app/lib/db";
import { verifyJwt } from "../../../app/lib/jwt";
import type { JWTPayload } from "../../../app/lib/jwt";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  try {
    // Get token from cookie or Authorization header
    const token =
      req.cookies.authToken ||
      (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : null);

    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const payload = await verifyJwt(token);

    if (!payload || typeof payload !== "object" || !("userId" in payload)) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    const typedPayload = payload as JWTPayload;

    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: typedPayload.userId,
        OR: [{ status: "ACTIVE" }, { status: "PENDING" }],
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "No active subscription found",
      });
    }

    return res.status(200).json({
      success: true,
      subscription,
    });
  } catch (error) {
    console.error("Get subscription error:", error);
    return res.status(500).json({
      success: false,
      message: "Could not retrieve subscription data. Please try again later.",
    });
  }
}
