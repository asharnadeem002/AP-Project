import { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import prisma from "../../../app/lib/db";
import { sendEmail, generateVerificationToken } from "../../../app/lib/email";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
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
    const validatedData = forgotPasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: {
        email: validatedData.email,
      },
    });

    if (!user) {
      return res.status(200).json({
        success: true,
        message:
          "If your email is registered, you will receive a password reset link shortly",
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before resetting your password",
      });
    }

    const resetToken = generateVerificationToken();
    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 1);

    await prisma.token.deleteMany({
      where: {
        userId: user.id,
        type: "PASSWORD_RESET",
      },
    });

    await prisma.token.create({
      data: {
        token: resetToken,
        type: "PASSWORD_RESET",
        expiresAt: tokenExpiry,
        userId: user.id,
      },
    });

    try {
      await sendEmail(user.email, "passwordReset", { token: resetToken });
    } catch (sendError) {
      console.error("Error sending password reset email:", sendError);
      return res.status(500).json({
        success: false,
        message: "Failed to send password reset email. Please try again later.",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "If your email is registered, you will receive a password reset link shortly",
    });
  } catch (error) {
    console.error("Forgot password error:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.errors,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Could not process request. Please try again later.",
    });
  }
}
