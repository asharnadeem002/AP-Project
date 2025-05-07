import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { sendEmail, generateVerificationToken } from "../../../app/lib/email";

const prisma = new PrismaClient();

// Input validation schema
const resendVerificationSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST method
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  try {
    // Validate input
    const { email } = resendVerificationSchema.parse(req.body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified",
      });
    }

    // Generate new verification token
    const verificationToken = generateVerificationToken();

    // Update user with new verification token
    await prisma.verificationToken.upsert({
      where: { userId: user.id },
      update: {
        token: verificationToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      },
      create: {
        userId: user.id,
        token: verificationToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      },
    });

    // Send verification email
    await sendEmail(email, "verification", { token: verificationToken });

    return res.status(200).json({
      success: true,
      message: "Verification email has been resent",
    });
  } catch (error) {
    console.error("Error resending verification email:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors,
      });
    }

    return res.status(500).json({
      success: false,
      message: "An error occurred while resending the verification email",
    });
  } finally {
    await prisma.$disconnect();
  }
}
