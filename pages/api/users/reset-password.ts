import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../app/lib/db";
import { verifyJwt } from "../../../app/lib/jwt";
import type { JWTPayload } from "../../../app/lib/jwt";
import * as bcrypt from "bcrypt";

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
    const token = req.cookies.authToken;

    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const payload = await verifyJwt(token);

    if (!payload || typeof payload !== "object" || !("userId" in payload)) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    const typedPayload = payload as JWTPayload;
    const userId = typedPayload.userId;

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters and include uppercase, lowercase, numbers, and special characters",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        password: true,
      },
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isPasswordValid) {
      return res
        .status(400)
        .json({ success: false, message: "Current password is incorrect" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.$executeRaw`
      UPDATE User 
      SET password = ${hashedPassword}
      WHERE id = ${userId}
    `;

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred. Please try again later.",
    });
  } finally {
    await prisma.$disconnect();
  }
}
