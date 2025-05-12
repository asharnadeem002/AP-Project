import { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import prisma from "../../../app/lib/db";
import { verifyJwt } from "../../../app/lib/jwt";
import { sendEmail } from "../../../app/lib/email";

const approveSubscriptionSchema = z.object({
  subscriptionId: z.string().uuid("Invalid subscription ID format"),
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

    if (!payload || typeof payload !== "object" || !("role" in payload)) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    if (payload.role !== "ADMIN") {
      return res
        .status(403)
        .json({ success: false, message: "Insufficient permissions" });
    }

    const validatedData = approveSubscriptionSchema.parse(req.body);

    const subscription = await prisma.subscription.findUnique({
      where: {
        id: validatedData.subscriptionId,
      },
      include: {
        user: {
          select: {
            email: true,
            username: true,
          },
        },
      },
    });

    if (!subscription) {
      return res
        .status(404)
        .json({ success: false, message: "Subscription not found" });
    }

    if (subscription.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: `Cannot approve subscription with status ${subscription.status}`,
      });
    }

    const now = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    const updatedSubscription = await prisma.subscription.update({
      where: {
        id: subscription.id,
      },
      data: {
        status: "ACTIVE",
        startDate: now,
        endDate: subscription.plan === "FREE" ? null : endDate,
      },
    });

    try {
      const planDisplay =
        subscription.plan.charAt(0) + subscription.plan.slice(1).toLowerCase();

      const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
      const loginUrl = `${baseUrl}/dashboard`;

      await sendEmail(subscription.user.email, "subscriptionApproved", {
        plan: planDisplay,
        startDate: now.toLocaleDateString(),
        endDate:
          subscription.plan === "FREE" ? "Never" : endDate.toLocaleDateString(),
        paymentMethod: subscription.paymentMethod,
        loginUrl,
        year: new Date().getFullYear().toString(),
      });
    } catch (emailError) {
      console.error("Error sending approval email:", emailError);
    }

    return res.status(200).json({
      success: true,
      message: "Subscription approved successfully",
      subscription: updatedSubscription,
    });
  } catch (error) {
    console.error("Approve subscription error:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.errors,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Could not approve subscription. Please try again later.",
    });
  }
}
