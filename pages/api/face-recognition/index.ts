import { NextApiRequest, NextApiResponse } from "next";
import { verifyJwt } from "../../../app/lib/jwt";
import prisma from "../../../app/lib/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const token =
      req.cookies.authToken || req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res
        .status(401)
        .json({ message: "Unauthorized - No token provided" });
    }

    const payload = await verifyJwt(token);
    if (!payload || typeof payload !== "object" || !("userId" in payload)) {
      return res.status(401).json({ message: "Unauthorized - Invalid token" });
    }

    const userId = payload.userId as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Get all face recognition results for the user
    const results = await prisma.faceRecognitionResult.findMany({
      where: { userId },
      include: {
        referenceImage: {
          select: {
            id: true,
            title: true,
            fileUrl: true,
          },
        },
        video: {
          select: {
            id: true,
            title: true,
            fileUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });

    // Get the total count
    const total = await prisma.faceRecognitionResult.count({
      where: { userId },
    });

    // Return the results
    return res.status(200).json({
      success: true,
      results,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("List face recognition results error:", error);
    return res.status(500).json({
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
}
