import { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import prisma from "../../../app/lib/db";
import { sendEmail } from "../../../app/lib/email";

const verifyEmailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  token: z.string().min(6).max(6),
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
    const validatedData = verifyEmailSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: {
        email: validatedData.email,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Email already verified",
      });
    }

    const token = await prisma.token.findFirst({
      where: {
        userId: user.id,
        token: validatedData.token,
        type: "VERIFICATION",
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification token",
      });
    }

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        isVerified: true,
      },
    });

    await prisma.token.delete({
      where: {
        id: token.id,
      },
    });

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
        await sendEmail(admin.email, "accountApproved", undefined);
      }
    }

    return res.status(200).json({
      success: true,
      message:
        "Email verified successfully. Your account is now pending admin approval.",
    });
  } catch (error) {
    console.error("Email verification error:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.errors,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Could not verify email. Please try again later.",
    });
  }
}
