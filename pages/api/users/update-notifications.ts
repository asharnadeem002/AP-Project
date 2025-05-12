import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../app/lib/db";
import { verifyJwt } from "../../../app/lib/jwt";
import type { JWTPayload } from "../../../app/lib/jwt";

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

    const { notifications } = req.body;

    if (!notifications || typeof notifications !== "object") {
      return res.status(400).json({
        success: false,
        message: "Invalid notification settings",
      });
    }

    const validatedSettings = {
      emailNotifications: Boolean(notifications.emailNotifications),
      smsNotifications: Boolean(notifications.smsNotifications),
      appNotifications: Boolean(notifications.appNotifications),
    };

    const jsonSettings = JSON.stringify(validatedSettings);

    await prisma.$executeRaw`
      UPDATE User 
      SET notifications = ${jsonSettings}
      WHERE id = ${userId}
    `;

    return res.status(200).json({
      success: true,
      message: "Notification settings updated successfully",
    });
  } catch (error) {
    console.error("Update notifications error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred. Please try again later.",
    });
  } finally {
    await prisma.$disconnect();
  }
}
