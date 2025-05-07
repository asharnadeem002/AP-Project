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
    // Get the authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Extract the token
    const token = authHeader.split(" ")[1];

    // Verify the token
    const payload = verifyJwt(token);

    if (!payload) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    // Get the user's active subscription
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: payload.userId,
        OR: [{ status: "ACTIVE" }, { status: "PENDING" }],
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "No active subscription found",
      });
    }

    return res.status(200).json({
      success: true,
      subscription,
    });
  } catch (error) {
    console.error("Get subscription error:", error);
    return res.status(500).json({
      success: false,
      message: "Could not retrieve subscription data. Please try again later.",
    });
  }
}
