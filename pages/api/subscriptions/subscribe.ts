import { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import prisma from "../../../app/lib/db";
import { verifyJwt } from "../../../app/lib/jwt";
import type { JWTPayload } from "../../../app/lib/jwt";
// Import will be used in a future implementation
// import { sendEmail } from "../../../app/lib/email";

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

    if (!payload || typeof payload !== "object" || !("userId" in payload)) {
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
    // Check if the user is active
    if (!user.isApproved) {
      return res.status(403).json({
        success: false,
        message:
          "Your account is currently deactivated. Please request reactivation before subscribing to a plan.",
      });
    }

    // Check if the user already has an active or pending subscription
    const existingActiveSubscription = await prisma.subscription.findFirst({
      where: {
        userId: typedPayload.userId,
        status: "ACTIVE",
      },
    });

    const existingPendingSubscription = await prisma.subscription.findFirst({
      where: {
        userId: typedPayload.userId,
        status: "PENDING",
      },
    });

    if (existingActiveSubscription) {
      // If the user wants to switch to the same plan, return an error
      if (existingActiveSubscription.plan === validatedData.plan) {
        return res.status(400).json({
          success: false,
          message: "You are already subscribed to this plan",
        });
      }

      // For demo purposes, we'll just cancel the old subscription before creating a new one
      await prisma.subscription.update({
        where: {
          id: existingActiveSubscription.id,
        },
        data: {
          status: "CANCELED",
          endDate: new Date(),
        },
      });
    }

    if (existingPendingSubscription) {
      return res.status(400).json({
        success: false,
        message:
          "You already have a pending subscription request. Please wait for administrator approval.",
      });
    }

    // Calculate subscription period (for demo purposes, 1 month)
    const now = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    // Create new subscription with PENDING status (except for FREE plan)
    const newSubscription = await prisma.subscription.create({
      data: {
        userId: typedPayload.userId,
        plan: validatedData.plan,
        status: validatedData.plan === "FREE" ? "ACTIVE" : "PENDING", // FREE plan is auto-approved
        paymentMethod: validatedData.paymentMethod,
        startDate: validatedData.plan === "FREE" ? now : null, // Only set start date for FREE plan
        endDate: validatedData.plan === "FREE" ? null : null, // End date will be set when approved
      },
    });

    // If free plan, no need for approval
    if (validatedData.plan === "FREE") {
      return res.status(201).json({
        success: true,
        message: `Successfully subscribed to the FREE plan`,
        subscription: newSubscription,
      });
    }

    // Notify admins about the new subscription request
    const admins = await prisma.user.findMany({
      where: {
        role: "ADMIN",
      },
      select: {
        email: true,
      },
    });

    // If there are admins, notify them about the new subscription request
    if (admins.length > 0) {
      for (const admin of admins) {
        // Send notification email to admin (in a real app, you might want to implement this differently)
        // This is a placeholder for the admin notification
        console.log(
          `Notifying admin ${admin.email} about new subscription request from ${user.email}`
        );
      }
    }

    return res.status(201).json({
      success: true,
      message: `Your subscription request for the ${validatedData.plan} plan has been submitted and is pending approval`,
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
