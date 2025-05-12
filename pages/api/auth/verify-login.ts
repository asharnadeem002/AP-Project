import { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import prisma from "../../../app/lib/db";
import { signJwt } from "../../../app/lib/jwt";

const verifyLoginSchema = z.object({
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
    const validatedData = verifyLoginSchema.parse(req.body);

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

    const validToken = await prisma.token.findFirst({
      where: {
        token: validatedData.token,
        type: "LOGIN",
        expiresAt: {
          gte: new Date(),
        },
        user: {
          email: validatedData.email,
        },
      },
      include: {
        user: true,
      },
    });

    if (!validToken) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid or expired token. Please request a new login verification code.",
      });
    }

    if (
      Object.prototype.hasOwnProperty.call(user, "isActive") &&
      user.isActive === false
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Your account has been deactivated. Please contact support or request reactivation.",
      });
    }

    await prisma.token.delete({
      where: {
        id: validToken.id,
      },
    });

    const isActive = Object.prototype.hasOwnProperty.call(user, "isActive")
      ? user.isActive
      : true;
    const jwtToken = await signJwt({
      userId: user.id,
      role: user.role,
      isActive: isActive,
    });

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
      isActive: isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    res.setHeader(
      "Set-Cookie",
      `authToken=${jwtToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${
        60 * 60 * 24 * 7
      }`
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
