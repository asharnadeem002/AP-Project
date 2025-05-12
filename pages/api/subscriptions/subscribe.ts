import { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import prisma from "../../../app/lib/db";
import { verifyJwt } from "../../../app/lib/jwt";
import type { JWTPayload } from "../../../app/lib/jwt";
const subscriptionSchema = z.object({
  plan: z.enum(["FREE", "BASIC", "PREMIUM", "ENTERPRISE"]),
  paymentMethod: z.enum(["CASH", "STRIPE", "PAYPAL"]),
});

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

    const validatedData = subscriptionSchema.parse(req.body);

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
    if (!user.isApproved) {
      return res.status(403).json({
        success: false,
        message:
          "Your account is currently deactivated. Please request reactivation before subscribing to a plan.",
      });
    }

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
      if (existingActiveSubscription.plan === validatedData.plan) {
        return res.status(400).json({
          success: false,
          message: "You are already subscribed to this plan",
        });
      }

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

    const now = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    const newSubscription = await prisma.subscription.create({
      data: {
        userId: typedPayload.userId,
        plan: validatedData.plan,
        status: validatedData.plan === "FREE" ? "ACTIVE" : "PENDING",
        paymentMethod: validatedData.paymentMethod,
        startDate: validatedData.plan === "FREE" ? now : null,
        endDate: validatedData.plan === "FREE" ? null : null,
      },
    });

    if (validatedData.plan === "FREE") {
      return res.status(201).json({
        success: true,
        message: `Successfully subscribed to the FREE plan`,
        subscription: newSubscription,
      });
    }

    const admins = await prisma.user.findMany({
      where: {
        role: "ADMIN",
      },
      select: {
        email: true,
      },
    });

    if (admins.length > 0) {
      for (const admin of admins) {
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
