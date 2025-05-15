import { NextApiRequest, NextApiResponse } from "next";
import fetch from "node-fetch";
import { verifyJwt } from "../../../../app/lib/jwt";
import fs from "fs";
import path from "path";
import os from "os";

// Python API URL
const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8000";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Verify JWT authentication
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

    // Extract parameters from the URL
    const { params } = req.query;

    if (!params || !Array.isArray(params) || params.length < 2) {
      return res.status(400).json({ message: "Invalid frame request" });
    }

    const [taskId, frameIdWithExtension] = params;

    // Get frame image from Python API
    try {
      // Check if we're directly running Python or using Docker
      // Try several potential temp directories
      const possibleTempDirs = [
        // Standard temp location
        path.join(os.tmpdir(), "face_recognition_uploads", taskId),
        // Alternative direct path (no temp dir)
        path.join(process.cwd(), "python", "temp", taskId),
        // Another possible location
        path.join(
          os.tmpdir().replace(/\\/g, "/"),
          "face_recognition_uploads",
          taskId
        ),
      ];

      // Try to find the directory with the frames
      let tempDir = null;
      for (const dir of possibleTempDirs) {
        if (fs.existsSync(dir)) {
          tempDir = dir;
          console.log(`Found frame directory: ${dir}`);
          break;
        }
      }

      // If any temp directory exists, we're running Python directly
      if (tempDir) {
        // Extract the match index and frame number from the frame ID
        const frameId = frameIdWithExtension.split(".")[0]; // Remove file extension if present
        const parts = frameId.split("_");

        if (parts.length !== 2) {
          return res.status(400).json({ message: "Invalid frame ID format" });
        }

        const matchIndex = parts[0];
        const frameNumber = parts[1];

        // Try multiple possible naming patterns
        const possibleFramePaths = [
          path.join(tempDir, `match_${matchIndex}_frame_${frameNumber}.jpg`),
          path.join(tempDir, `match_${matchIndex}frame_${frameNumber}.jpg`),
          path.join(tempDir, `${matchIndex}_${frameNumber}.jpg`),
        ];

        let framePath = null;
        for (const path of possibleFramePaths) {
          if (fs.existsSync(path)) {
            framePath = path;
            break;
          }
        }

        if (!framePath) {
          // Generate a placeholder image with frame info
          return res.status(200).json({
            placeholder: true,
            frameId: `${matchIndex}_${frameNumber}`,
            message: "Frame image placehoder",
          });
        }

        // Read the image file and serve it
        const imageBuffer = fs.readFileSync(framePath);
        res.setHeader("Content-Type", "image/jpeg");
        return res.send(imageBuffer);
      }
      // Otherwise, call the Python API
      else {
        const frameId = frameIdWithExtension;
        const response = await fetch(
          `${PYTHON_API_URL}/frame/${taskId}/${frameId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          return res.status(response.status).json(errorData);
        }

        // Check if the response is JSON or binary data
        const contentType = response.headers.get("content-type");

        if (contentType && contentType.includes("application/json")) {
          // If it's JSON, it's likely an error message
          const data = await response.json();
          return res.status(200).json(data);
        } else {
          // If it's binary data, it's the image
          const imageBuffer = await response.buffer();
          res.setHeader("Content-Type", contentType || "image/jpeg");
          return res.send(imageBuffer);
        }
      }
    } catch (error) {
      console.error("Error fetching frame:", error);
      return res.status(500).json({
        message: "Error fetching frame",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  } catch (error) {
    console.error("Frame API error:", error);
    return res.status(500).json({
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
}
