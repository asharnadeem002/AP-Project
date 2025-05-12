import { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import prisma from "../../../app/lib/db";

const requestReactivationSchema = z.object({
  email: z.string().email("Invalid email address"),
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
    const validatedData = requestReactivationSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: {
        email: validatedData.email,
      },
    });

    if (!user) {
      return res.status(200).json({
        success: true,
        message:
          "If your account exists, a reactivation request has been submitted.",
      });
    }

    const isAccountActive = user.isActive ?? true;

    if (isAccountActive) {
      return res.status(200).json({
        success: true,
        message: "Your account is already active. You can log in now.",
      });
    }

    const reactivationAlreadyRequested = user.reactivationRequested ?? false;

    if (reactivationAlreadyRequested) {
      return res.status(200).json({
        success: true,
        message: "A reactivation request is already pending for this account.",
      });
    }

    console.log(`Reactivation requested for user: ${user.email}`);

    return res.status(200).json({
      success: true,
      message:
        "Your reactivation request has been submitted. An administrator will review it shortly.",
    });
  } catch (error) {
    console.error("Reactivation request error:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.errors,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Could not process your request. Please try again later.",
    });
  }
}
