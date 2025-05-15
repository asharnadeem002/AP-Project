import { NextApiRequest, NextApiResponse } from "next";
import path from "path";
import { spawn } from "child_process";
import fs from "fs";
import { verifyJwt } from "../../../app/lib/jwt";
import prisma from "../../../app/lib/db";
import os from "os";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
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

    const userId = payload.userId as string;
    const { referenceImageId, videoId } = req.body;

    if (!referenceImageId || !videoId) {
      return res.status(400).json({
        message: "Reference image ID and video ID are required",
      });
    }

    // Check if reference image and video exist and belong to the user
    const referenceImage = await prisma.galleryItem.findUnique({
      where: { id: referenceImageId, userId },
    });

    const video = await prisma.galleryItem.findUnique({
      where: { id: videoId, userId },
    });

    if (!referenceImage) {
      return res.status(404).json({ message: "Reference image not found" });
    }

    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    if (referenceImage.mediaType !== "IMAGE") {
      return res.status(400).json({
        message: "Reference file must be an image",
      });
    }

    if (video.mediaType !== "VIDEO") {
      return res.status(400).json({
        message: "Second file must be a video",
      });
    }

    // Create a record in the database with status "processing"
    const faceRecognitionResult = await prisma.faceRecognitionResult.create({
      data: {
        userId,
        referenceImageId,
        videoId,
        matchCount: 0,
        status: "processing",
      },
    });

    // Set up paths
    const currentDir = process.cwd();
    const referenceImagePath = path.join(
      currentDir,
      "public",
      referenceImage.fileUrl.replace(/^\//, "")
    );
    const videoPath = path.join(
      currentDir,
      "public",
      video.fileUrl.replace(/^\//, "")
    );
    const outputDir = path.join(
      currentDir,
      "public",
      "face-recognition-results"
    );
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    const outputPath = path.join(outputDir, `${faceRecognitionResult.id}.json`);
    const modelPath = path.join(currentDir, "public", "best.pt");

    // Check files exist
    if (!fs.existsSync(referenceImagePath)) {
      await updateResultStatus(
        faceRecognitionResult.id,
        "failed",
        "Reference image file not found"
      );
      return res
        .status(404)
        .json({ message: "Reference image file not found" });
    }

    if (!fs.existsSync(videoPath)) {
      await updateResultStatus(
        faceRecognitionResult.id,
        "failed",
        "Video file not found"
      );
      return res.status(404).json({ message: "Video file not found" });
    }

    if (!fs.existsSync(modelPath)) {
      await updateResultStatus(
        faceRecognitionResult.id,
        "failed",
        "Model file not found"
      );
      return res.status(404).json({ message: "Model file not found" });
    }

    // Determine python path based on OS
    const pythonDir = path.join(currentDir, "python");
    const venvBinPath =
      os.platform() === "win32"
        ? path.join(pythonDir, "venv", "Scripts")
        : path.join(pythonDir, "venv", "bin");
    const pythonPath = path.join(
      venvBinPath,
      os.platform() === "win32" ? "python.exe" : "python"
    );

    // Run the face recognition script in the background
    const childProcess = spawn(pythonPath, [
      path.join(pythonDir, "face_recognition.py"),
      "--reference",
      referenceImagePath,
      "--video",
      videoPath,
      "--output",
      outputPath,
      "--model",
      modelPath,
    ]);

    // Handle process completion
    childProcess.on("close", async (code) => {
      try {
        if (code !== 0) {
          await updateResultStatus(
            faceRecognitionResult.id,
            "failed",
            "Processing failed"
          );
          return;
        }

        // Read and parse the output file
        const resultData = JSON.parse(fs.readFileSync(outputPath, "utf8"));

        if (resultData.status === "failed") {
          await updateResultStatus(
            faceRecognitionResult.id,
            "failed",
            resultData.error || "Unknown error"
          );
          return;
        }

        // Update the database record with the results
        await prisma.faceRecognitionResult.update({
          where: { id: faceRecognitionResult.id },
          data: {
            status: "completed",
            matchCount: resultData.matchCount,
            matches: resultData.matches,
            processedAt: new Date(),
          },
        });
      } catch (error) {
        console.error("Error processing results:", error);
        await updateResultStatus(
          faceRecognitionResult.id,
          "failed",
          error instanceof Error ? error.message : "Unknown error"
        );
      }
    });

    // Immediately return the ID to the client
    return res.status(200).json({
      success: true,
      message: "Face recognition processing started",
      id: faceRecognitionResult.id,
    });
  } catch (error) {
    console.error("Face recognition error:", error);
    return res.status(500).json({
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
}

// Helper function to update result status
async function updateResultStatus(id: string, status: string, error?: string) {
  await prisma.faceRecognitionResult.update({
    where: { id },
    data: {
      status,
      error,
      processedAt: new Date(),
    },
  });
}
