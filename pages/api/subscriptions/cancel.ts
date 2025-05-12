import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../app/lib/db";
import { verifyJwt } from "../../../app/lib/jwt";
import type { JWTPayload } from "../../../app/lib/jwt";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
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

    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: typedPayload.userId,
        status: "ACTIVE",
      },
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "No active subscription found",
      });
    }

    if (subscription.plan === "FREE") {
      return res.status(400).json({
        success: false,
        message: "Free subscriptions cannot be canceled",
      });
    }

    await prisma.subscription.update({
      where: {
        id: subscription.id,
      },
      data: {
        status: "CANCELED",
        endDate: new Date(),
      },
    });

    const freeSubscription = await prisma.subscription.create({
      data: {
        userId: typedPayload.userId,
        plan: "FREE",
        status: "ACTIVE",
        paymentMethod: "CASH",
        startDate: new Date(),
        endDate: null,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Subscription canceled successfully",
      subscription: freeSubscription,
    });
  } catch (error) {
    console.error("Cancel subscription error:", error);
    return res.status(500).json({
      success: false,
      message: "Could not cancel subscription. Please try again later.",
    });
  }
}
