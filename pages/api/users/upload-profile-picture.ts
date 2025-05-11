import { NextApiRequest, NextApiResponse } from "next";
import { IncomingForm, Fields, Files, Part } from "formidable";
import { promises as fs } from "fs";
import path from "path";
import { verifyJwt } from "../../../app/lib/jwt";
import type { JWTPayload } from "../../../app/lib/jwt";
import prisma from "../../../app/lib/db";

export const config = {
  api: {
    bodyParser: false,
  },
};

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

    const form = new IncomingForm({
      maxFileSize: 5 * 1024 * 1024,
      keepExtensions: true,
      filter: (part: Part) => {
        return (
          part.name === "profilePicture" &&
          (part.mimetype?.includes("image/") || false)
        );
      },
    });

    const uploadDir = path.join(process.cwd(), "public", "uploads", "profile");
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }

    return new Promise<void>((resolve) => {
      form.parse(
        req,
        async (err: Error | null, fields: Fields, files: Files) => {
          if (err) {
            console.error("File upload error:", err);
            res.status(500).json({
              success: false,
              message: "File upload failed",
            });
            return resolve();
          }

          const file = Array.isArray(files.profilePicture)
            ? files.profilePicture[0]
            : files.profilePicture;

          if (!file) {
            res.status(400).json({
              success: false,
              message: "No image file provided",
            });
            return resolve();
          }

          try {
            const fileExtension = path.extname(file.filepath);
            const fileName = `${userId}-${Date.now()}${fileExtension}`;
            const destinationPath = path.join(uploadDir, fileName);

            const data = await fs.readFile(file.filepath);
            await fs.writeFile(destinationPath, data);

            await fs.unlink(file.filepath);

            const fileUrl = `/uploads/profile/${fileName}`;

            await prisma.user.update({
              where: { id: userId },
              data: { profilePicture: fileUrl },
            });

            res.status(200).json({
              success: true,
              message: "Profile picture uploaded successfully",
              profilePicture: fileUrl,
            });
            resolve();
          } catch (error) {
            console.error("File processing error:", error);
            res.status(500).json({
              success: false,
              message: "Error processing the uploaded file",
            });
            resolve();
          }
        }
      );
    });
  } catch (error) {
    console.error("Profile picture upload error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred during file upload. Please try again.",
    });
  } finally {
    await prisma.$disconnect();
  }
}
