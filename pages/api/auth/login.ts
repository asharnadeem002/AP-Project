import { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "../../../app/lib/db";
import { sendEmail, generateVerificationToken } from "../../../app/lib/email";

const loginSchema = z
  .object({
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(1, "Password is required")
      .optional()
      .or(z.literal(undefined)),
    resend: z.boolean().optional(),
  })
  .refine(
    (data) => {
      // If this is not a resend request, then password must be provided
      if (!data.resend) {
        return !!data.password;
      }
      return true;
    },
    {
      message: "Password is required for login",
      path: ["password"],
    }
  );

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
    const validatedData = loginSchema.parse(req.body);

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

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before logging in",
      });
    }

    if (!user.isApproved) {
      return res.status(403).json({
        success: false,
        message: "Your account is pending approval by an administrator",
      });
    }

    // Skip password validation if this is a resend request
    if (!validatedData.resend) {
      const passwordValid = await bcrypt.compare(
        validatedData.password as string,
        user.password
      );

      if (!passwordValid) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }
    }

    const loginToken = generateVerificationToken();
    const tokenExpiry = new Date();
    tokenExpiry.setMinutes(tokenExpiry.getMinutes() + 15);

    await prisma.token.create({
      data: {
        token: loginToken,
        type: "LOGIN",
        expiresAt: tokenExpiry,
        userId: user.id,
      },
    });

    await sendEmail(user.email, "login", { token: loginToken });

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
