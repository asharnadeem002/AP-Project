import { NextApiRequest, NextApiResponse } from "next";
import path from "path";
import fs from "fs";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { path: filePath } = req.query;

    if (!filePath) {
      return res.status(400).json({ message: "No file path provided" });
    }

    const filePathArray = Array.isArray(filePath) ? filePath : [filePath];
    const fullPath = path.join(
      process.cwd(),
      "public",
      "uploads",
      ...filePathArray
    );

    const normalizedPath = path.normalize(fullPath);
    if (
      !normalizedPath.startsWith(path.join(process.cwd(), "public", "uploads"))
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (!fs.existsSync(normalizedPath)) {
      return res.status(404).json({ message: "File not found" });
    }

    const stat = fs.statSync(normalizedPath);

    const ext = path.extname(normalizedPath).toLowerCase();
    const contentTypeMap: { [key: string]: string } = {
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".mp4": "video/mp4",
      ".webm": "video/webm",
    };

    res.setHeader("Content-Length", stat.size);
    res.setHeader(
      "Content-Type",
      contentTypeMap[ext] || "application/octet-stream"
    );
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");

    const fileStream = fs.createReadStream(normalizedPath);
    return new Promise((resolve, reject) => {
      fileStream.pipe(res);
      fileStream.on("error", (error) => {
        console.error("Stream error:", error);
        reject(error);
      });
      fileStream.on("end", () => resolve(undefined));
    });
  } catch (error) {
    console.error("File serving error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
