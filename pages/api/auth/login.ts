import { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "../../../app/lib/db";
import { sendEmail, generateVerificationToken } from "../../../app/lib/email";

// Validation schema
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
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
    const validatedData = loginSchema.parse(req.body);

    // Find the user
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

    // Check if user email is verified
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before logging in",
      });
    }

    // Check if user is approved by admin
    if (!user.isApproved) {
      return res.status(403).json({
        success: false,
        message: "Your account is pending approval by an administrator",
      });
    }

    // Verify password
    const passwordValid = await bcrypt.compare(
      validatedData.password,
      user.password
    );

    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate login verification token
    const loginToken = generateVerificationToken();
    const tokenExpiry = new Date();
    tokenExpiry.setMinutes(tokenExpiry.getMinutes() + 15); // Token valid for 15 minutes

    // Store the token
    await prisma.token.create({
      data: {
        token: loginToken,
        type: "LOGIN",
        expiresAt: tokenExpiry,
        userId: user.id,
      },
    });

    // Send verification email
    await sendEmail(user.email, "login", loginToken);

    return res.status(200).json({
      success: true,
      message: "Login verification code sent to your email",
      email: user.email,
    });
  } catch (error) {
    console.error("Login error:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.errors,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Could not log in. Please try again later.",
    });
  }
}
