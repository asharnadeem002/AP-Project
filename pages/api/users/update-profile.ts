import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../app/lib/db";
import { verifyJwt } from "../../../app/lib/jwt";
import type { JWTPayload } from "../../../app/lib/jwt";
import { updateProfileSchema } from "../../../app/lib/validations";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "PUT") {
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

    if (!payload || typeof payload !== "object" || !("userId" in payload)) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    const typedPayload = payload as JWTPayload;
    const userId = typedPayload.userId;

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const { username, phoneNumber, gender, profilePicture } = req.body;

    try {
      updateProfileSchema.parse({
        username: username || undefined,
        phoneNumber: phoneNumber || undefined,
        gender: gender || undefined,
      });
    } catch (validationError: unknown) {
      const errors =
        validationError instanceof Error
          ? validationError.message
          : "Validation failed";
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    if (username && username !== existingUser.username) {
      const usernameExists = await prisma.user.findFirst({
        where: {
          username,
          id: { not: userId },
        },
      });

      if (usernameExists) {
        return res.status(400).json({
          success: false,
          message: "Username is already taken",
        });
      }
    }

    if (profilePicture && typeof profilePicture === "string") {
      try {
        new URL(profilePicture);
      } catch {
        return res.status(400).json({
          success: false,
          message: "Invalid profile picture URL",
        });
      }
    }

    const updateData: Record<string, string | null> = {};
    if (username !== undefined) updateData.username = username;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (gender !== undefined) updateData.gender = gender;
    if (profilePicture !== undefined)
      updateData.profilePicture = profilePicture;

    if (Object.keys(updateData).length === 0) {
      return res.status(200).json({
        success: true,
        message: "No changes to update",
      });
    }

    if (existingUser.role !== "ADMIN" && typedPayload.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to update this profile",
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        phoneNumber: true,
        gender: true,
        profilePicture: true,
        isVerified: true,
        isApproved: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({
      success: false,
      message:
        "An error occurred while updating your profile. Please try again.",
    });
  } finally {
    await prisma.$disconnect();
  }
}
