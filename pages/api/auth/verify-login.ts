import { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import prisma from "../../../app/lib/db";
import { signJwt } from "../../../app/lib/jwt";

// Validation schema
const verifyLoginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  token: z.string().min(6).max(6),
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
    const validatedData = verifyLoginSchema.parse(req.body);

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

    // Find the token
    const token = await prisma.token.findFirst({
      where: {
        userId: user.id,
        token: validatedData.token,
        type: "LOGIN",
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

    // Delete the used token
    await prisma.token.delete({
      where: {
        id: token.id,
      },
    }); // Generate JWT token
    const jwtToken = signJwt({ userId: user.id, role: user.role });

    // Return user data (excluding sensitive fields)
    const userData = {
      id: user.id,
      email: user.email,
      username: user.username,
      phoneNumber: user.phoneNumber,
      gender: user.gender,
      profilePicture: user.profilePicture,
      role: user.role,
      isVerified: user.isVerified,
      isApproved: user.isApproved,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }; // Set the token in an HTTP-only cookie that's accessible by the middleware
    // Using SameSite=Lax to ensure the cookie is sent with navigation requests
    res.setHeader(
      "Set-Cookie",
      `authToken=${jwtToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${
        60 * 60 * 24 * 7
      }` // 1 week
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token: jwtToken,
      user: userData,
    });
  } catch (error) {
    console.error("Login verification error:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.errors,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Could not verify login. Please try again later.",
    });
  }
}
