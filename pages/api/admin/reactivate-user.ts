import { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import prisma from "../../../app/lib/db";
import { verifyJwt } from "../../../app/lib/jwt";
import { sendEmail } from "../../../app/lib/email";

// Validation schema
const reactivateUserSchema = z.object({
  userId: z.string().uuid("Invalid user ID format"),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== "POST") {
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

    if (!payload || typeof payload !== "object" || !("role" in payload)) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    // Verify admin role
    if (payload.role !== "ADMIN") {
      return res
        .status(403)
        .json({ success: false, message: "Insufficient permissions" });
    }

    // Validate request body
    const validatedData = reactivateUserSchema.parse(req.body);

    // Find the user
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

    // If user is already active
    if (user.isActive === true) {
      return res
        .status(400)
        .json({ success: false, message: "User is already active" });
    }

    // Update user to active status
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        isActive: true,
      },
    });

    // Send reactivation email to the user
    try {
      const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
      const loginUrl = `${baseUrl}/login`;

      await sendEmail(user.email, "accountReactivated", {
        loginUrl,
        year: new Date().getFullYear().toString(),
      });
    } catch (emailError) {
      console.error("Error sending reactivation email:", emailError);
      // Continue the process even if the email fails
    }

    return res.status(200).json({
      success: true,
      message: "User reactivated successfully",
    });
  } catch (error) {
    console.error("Reactivate user error:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.errors,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Could not reactivate user. Please try again later.",
    });
  }
}
