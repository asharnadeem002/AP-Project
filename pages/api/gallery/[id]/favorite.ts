import { NextApiRequest, NextApiResponse } from "next";
import { verifyJwt } from "@/app/lib/jwt";
import prisma from "@/app/lib/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const token =
      req.cookies.authToken || req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const payload = await verifyJwt(token);
    if (!payload || typeof payload !== "object" || !("userId" in payload)) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const { id } = req.query;
    if (!id || typeof id !== "string") {
      return res.status(400).json({ message: "Invalid item ID" });
    }

    const { isFavorite } = req.body;
    if (typeof isFavorite !== "boolean") {
      return res.status(400).json({ message: "Invalid favorite status" });
    }

    const galleryItem = await prisma.galleryItem.findUnique({
      where: { id },
    });

    if (!galleryItem) {
      return res.status(404).json({ message: "Item not found" });
    }

    if (galleryItem.userId !== payload.userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const updatedItem = await prisma.galleryItem.update({
      where: { id },
      data: { isFavorite },
    });

    return res.status(200).json({
      success: true,
      item: updatedItem,
    });
  } catch (error) {
    console.error("Favorite update error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
