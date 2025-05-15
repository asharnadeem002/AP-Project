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
    const { id } = req.query;

    if (!id || typeof id !== "string") {
      return res.status(400).json({
        message: "Invalid request. ID is required.",
      });
    }

    // Get the face recognition result
    const result = await prisma.faceRecognitionResult.findUnique({
      where: { id },
      include: {
        referenceImage: true,
        video: true,
      },
    });

    if (!result) {
      return res
        .status(404)
        .json({ message: "Face recognition result not found" });
    }

    // Check if the result belongs to the requesting user or an admin
    if (result.userId !== userId && payload.role !== "ADMIN") {
      return res
        .status(403)
        .json({ message: "You don't have permission to access this result" });
    }

    // Return the result
    return res.status(200).json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("Get face recognition result error:", error);
    return res.status(500).json({
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
}
