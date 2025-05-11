import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../app/lib/db";
import { verifyJwt } from "../../../app/lib/jwt";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow GET requests
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  try {
    // Verify admin authentication
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    const payload = await verifyJwt(token);

    if (!payload || typeof payload !== 'object' || !('role' in payload)) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    // Verify admin role
    if (payload.role !== "ADMIN") {
      return res
        .status(403)
        .json({ success: false, message: "Insufficient permissions" });
    }

    // Get pagination parameters
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get pending users
    const pendingUsers = await prisma.user.findMany({
      where: {
        isVerified: true,
        isApproved: false,
        role: "USER",
      },
      select: {
        id: true,
        email: true,
        username: true,
        phoneNumber: true,
        gender: true,
        profilePicture: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });

    // Get total count for pagination
    const totalCount = await prisma.user.count({
      where: {
        isVerified: true,
        isApproved: false,
        role: "USER",
      },
    });

    return res.status(200).json({
      success: true,
      users: pendingUsers,
      pagination: {
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
        currentPage: page,
        perPage: limit,
      },
    });
  } catch (error) {
    console.error("Get pending users error:", error);
    return res.status(500).json({
      success: false,
      message: "Could not retrieve pending users. Please try again later.",
    });
  }
}
