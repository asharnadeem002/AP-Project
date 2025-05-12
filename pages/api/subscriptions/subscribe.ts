import { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import prisma from "../../../app/lib/db";
import { verifyJwt } from "../../../app/lib/jwt";
import type { JWTPayload } from "../../../app/lib/jwt";

// Validation schema
const subscriptionSchema = z.object({
  plan: z.enum(["FREE", "BASIC", "PREMIUM", "ENTERPRISE"]),
  paymentMethod: z.enum(["CASH", "STRIPE", "PAYPAL"]),
});

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
    const payload = await verifyJwt(token);

    if (!payload || typeof payload !== 'object' || !('userId' in payload)) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    const typedPayload = payload as JWTPayload;

    // Validate request body
    const validatedData = subscriptionSchema.parse(req.body);

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: {
        id: typedPayload.userId,
      },
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Check if the user already has an active subscription
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        userId: typedPayload.userId,
        status: "ACTIVE",
      },
    });

    if (existingSubscription) {
      // If the user wants to switch to the same plan, return an error
      if (existingSubscription.plan === validatedData.plan) {
        return res.status(400).json({
          success: false,
          message: "You are already subscribed to this plan",
        });
      }

      // For demo purposes, we'll just cancel the old subscription and create a new one
      // In a real app, you might handle upgrading/downgrading differently
      await prisma.subscription.update({
        where: {
          id: existingSubscription.id,
        },
        data: {
          status: "CANCELED",
          endDate: new Date(),
        },
      });
    }

    // Calculate subscription period (for demo purposes, 1 month)
    const now = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    // Create new subscription
    const newSubscription = await prisma.subscription.create({
      data: {
        userId: typedPayload.userId,
        plan: validatedData.plan,
        status: "ACTIVE",
        paymentMethod: validatedData.paymentMethod,
        startDate: now,
        endDate: validatedData.plan === "FREE" ? null : endDate,
      },
    });

    return res.status(201).json({
      success: true,
      message: `Successfully subscribed to the ${validatedData.plan} plan`,
      subscription: newSubscription,
    });
  } catch (error) {
    console.error("Subscription error:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.errors,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Could not process subscription. Please try again later.",
    });
  }
}
