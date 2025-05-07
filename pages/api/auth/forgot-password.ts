import { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import prisma from "../../../app/lib/db";
import { sendEmail, generateVerificationToken } from "../../../app/lib/email";

// Validation schema
const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
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
    // Validate request body
    const validatedData = forgotPasswordSchema.parse(req.body);

    // Find the user
    const user = await prisma.user.findUnique({
      where: {
        email: validatedData.email,
      },
    });

    // For security reasons, don't reveal whether the email exists or not
    if (!user) {
      return res.status(200).json({
        success: true,
        message:
          "If your email is registered, you will receive a password reset link shortly",
      });
    }

    // Check if user email is verified
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before resetting your password",
      });
    }

    // Generate reset token
    const resetToken = generateVerificationToken();
    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 1); // Token valid for 1 hour

    // Delete any existing password reset tokens for this user
    await prisma.token.deleteMany({
      where: {
        userId: user.id,
        type: "PASSWORD_RESET",
      },
    });

    // Store the new token
    await prisma.token.create({
      data: {
        token: resetToken,
        type: "PASSWORD_RESET",
        expiresAt: tokenExpiry,
        userId: user.id,
      },
    });

    // Send password reset email
    await sendEmail(user.email, "passwordReset", resetToken);

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
