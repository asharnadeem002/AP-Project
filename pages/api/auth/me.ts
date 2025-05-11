import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../app/lib/db";
import { verifyJwt } from "../../../app/lib/jwt";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
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
    
    // Add await here since verifyJwt is now async
    const payload = await verifyJwt(token);

    if (!payload) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    // Fix the Prisma query syntax
    const user = await prisma.user.findUnique({
      where: {
        id: payload.userId
      },
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
        updatedAt: true
      }
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error("Get current user error:", error);
    return res.status(500).json({
      success: false,
      message: "Could not retrieve user data. Please try again later."
    });
  }
}