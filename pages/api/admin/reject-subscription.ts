import { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import prisma from "../../../app/lib/db";
import { verifyJwt } from "../../../app/lib/jwt";
import { sendEmail } from "../../../app/lib/email";

const rejectSubscriptionSchema = z.object({
  subscriptionId: z.string().uuid("Invalid subscription ID format"),
  rejectionReason: z.string().optional(),
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

    const validatedData = rejectSubscriptionSchema.parse(req.body);

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
        message: `Cannot reject subscription with status ${subscription.status}`,
      });
    }

    const rejectionReason = validatedData.rejectionReason;

    const updatedSubscription = await prisma.subscription.update({
      where: {
        id: subscription.id,
      },
      data: {
        status: "CANCELED",
      },
    });

    try {
      const planDisplay =
        subscription.plan.charAt(0) + subscription.plan.slice(1).toLowerCase();

      const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
      const subscriptionUrl = `${baseUrl}/subscription`;

      await sendEmail(subscription.user.email, "subscriptionRejected", {
        plan: planDisplay,
        requestDate: subscription.createdAt.toLocaleDateString(),
        rejectionReason: rejectionReason || "",
        subscriptionUrl,
        year: new Date().getFullYear().toString(),
      });
    } catch (emailError) {
      console.error("Error sending rejection email:", emailError);
    }

    return res.status(200).json({
      success: true,
      message: "Subscription rejected successfully",
      subscription: updatedSubscription,
    });
  } catch (error) {
    console.error("Reject subscription error:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.errors,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Could not reject subscription. Please try again later.",
    });
  }
}
