import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../app/lib/db";
import { verifyJwt } from "../../../app/lib/jwt";
import type { JWTPayload } from "../../../app/lib/jwt";

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

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const now = new Date().toISOString().slice(0, 19).replace("T", " ");
    await prisma.$executeRaw`
      UPDATE User
      SET deletionRequested = true, deletionRequestedAt = ${now}
      WHERE id = ${userId}
    `;

    return res.status(200).json({
      success: true,
      message: "Account deletion request submitted successfully",
    });
  } catch (error) {
    console.error("Account deletion request error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred. Please try again later.",
    });
  } finally {
    await prisma.$disconnect();
  }
}
