import { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import prisma from "../../../app/lib/db";
import { verifyJwt } from "../../../app/lib/jwt";
import { sendEmail } from "../../../app/lib/email";

const deactivateUserSchema = z.object({
  userId: z.string().uuid("Invalid user ID format"),
  deactivationReason: z.string().optional(),
});

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

    const validatedData = deactivateUserSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: {
        id: validatedData.userId,
      },
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (user.role === "ADMIN") {
      return res
        .status(400)
        .json({ success: false, message: "Cannot deactivate an admin user" });
    }

    if (user.isActive === false) {
      return res
        .status(400)
        .json({ success: false, message: "User is already deactivated" });
    }

    const deactivationReason = validatedData.deactivationReason;

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        isActive: false,
      },
    });

    try {
      const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
      const reactivationUrl = `${baseUrl}/request-reactivation`;

      await sendEmail(user.email, "accountDeactivated", {
        deactivationReason: deactivationReason || "",
        reactivationUrl,
        year: new Date().getFullYear().toString(),
      });
    } catch (emailError) {
      console.error("Error sending deactivation email:", emailError);
    }

    return res.status(200).json({
      success: true,
      message: "User deactivated successfully",
    });
  } catch (error) {
    console.error("Deactivate user error:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.errors,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Could not deactivate user. Please try again later.",
    });
  }
}
