import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../app/lib/db";
import { verifyJwt } from "../../../app/lib/jwt";
import { Prisma } from "@prisma/client";

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

    // Parse query parameters
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search as string | undefined;
    const status = req.query.status as string | undefined;
    const role = req.query.role as string | undefined;

    // Build query filter
    const where: Prisma.UserWhereInput = {};

    if (search) {
      where.OR = [
        { email: { contains: search } },
        { username: { contains: search } },
      ];
    }

    if (status === "verified") {
      where.isVerified = true;
    } else if (status === "unverified") {
      where.isVerified = false;
    } else if (status === "approved") {
      where.isApproved = true;
    } else if (status === "unapproved") {
      where.isApproved = false;
    }

    if (role === "admin") {
      where.role = "ADMIN";
    } else if (role === "user") {
      where.role = "USER";
    }

    // Count total users
    const totalUsers = await prisma.user.count({ where });

    // Fetch users with pagination
    const users = await prisma.user.findMany({
      where,
      skip,
      take: limit,
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
        // Exclude password
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculate pagination info
    const totalPages = Math.ceil(totalUsers / limit);

    return res.status(200).json({
      success: true,
      users,
      pagination: {
        total: totalUsers,
        currentPage: page,
        totalPages,
        limit,
      },
    });
  } catch (error) {
    console.error("Admin users list error:", error);
    return res.status(500).json({
      success: false,
      message: "Could not fetch users. Please try again later.",
    });
  }
}
