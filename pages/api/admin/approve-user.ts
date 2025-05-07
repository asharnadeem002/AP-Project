import { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import prisma from "../../../app/lib/db";
import { verifyJwt } from "../../../app/lib/jwt";
import { sendEmail } from "../../../app/lib/email";

// Validation schema
const approveUserSchema = z.object({
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
    const payload = verifyJwt(token);

    if (!payload) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    // Verify admin role
    if (payload.role !== "ADMIN") {
      return res
        .status(403)
        .json({ success: false, message: "Insufficient permissions" });
    }

    // Validate request body
    const validatedData = approveUserSchema.parse(req.body);

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

    if (user.isApproved) {
      return res
        .status(400)
        .json({ success: false, message: "User is already approved" });
    }

    // Update user approval status
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        isApproved: true,
      },
    });

    // Send approval notification email to the user
    await sendEmail(user.email, "accountApproved");

    return res.status(200).json({
      success: true,
      message: "User approved successfully",
    });
  } catch (error) {
    console.error("Approve user error:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.errors,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Could not approve user. Please try again later.",
    });
  }
}
