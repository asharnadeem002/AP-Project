import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../app/lib/db";
import { verifyJwt } from "../../../app/lib/jwt";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Extract the token
    const token = authHeader.split(" ")[1];

    // Verify the token
    const payload = verifyJwt(token);

    if (!payload) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    // Get the user's active subscription
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: payload.userId,
        status: "ACTIVE",
      },
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "No active subscription found",
      });
    }

    // Free subscriptions cannot be canceled
    if (subscription.plan === "FREE") {
      return res.status(400).json({
        success: false,
        message: "Free subscriptions cannot be canceled",
      });
    }

    // Cancel the subscription
    await prisma.subscription.update({
      where: {
        id: subscription.id,
      },
      data: {
        status: "CANCELED",
        endDate: new Date(), // End the subscription immediately for demo purposes
      },
    });

    // Create a free subscription for the user so they still have access to basic features
    const freeSubscription = await prisma.subscription.create({
      data: {
        userId: payload.userId,
        plan: "FREE",
        status: "ACTIVE",
        paymentMethod: "CASH", // Default for free plan
        startDate: new Date(),
        endDate: null, // Free plans never expire
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
