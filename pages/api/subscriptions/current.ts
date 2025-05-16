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
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];

    const payload = await verifyJwt(token);

    if (!payload || typeof payload !== "object" || !("userId" in payload)) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    const typedPayload = payload as JWTPayload;

    // First check if the user is an admin
    const user = await prisma.user.findUnique({
      where: { id: typedPayload.userId },
      select: { role: true },
    });

    // If admin, return success with null subscription
    if (user?.role === "ADMIN") {
      return res.status(200).json({
        success: true,
        subscription: null,
        isAdmin: true,
      });
    }

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
      // Instead of returning a 404 error, return success with null subscription
      return res.status(200).json({
        success: true,
        subscription: null,
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
