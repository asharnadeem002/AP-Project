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
    const payload = await verifyJwt(token);

    if (!payload || typeof payload !== "object" || !("role" in payload)) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    if (payload.role !== "ADMIN") {
      return res
        .status(403)
        .json({ success: false, message: "Insufficient permissions" });
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const subscriptions = await prisma.subscription.findMany({
      include: {
        user: {
          select: {
            email: true,
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });

    const totalCount = await prisma.subscription.count();

    return res.status(200).json({
      success: true,
      subscriptions,
      pagination: {
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
        currentPage: page,
        perPage: limit,
      },
    });
  } catch (error) {
    console.error("Get subscriptions error:", error);
    return res.status(500).json({
      success: false,
      message: "Could not retrieve subscription data. Please try again later.",
    });
  }
}
