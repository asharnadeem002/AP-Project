import { NextApiRequest, NextApiResponse } from "next";
import fetch from "node-fetch";
import { verifyJwt } from "../../../../../app/lib/jwt";

// Python API URL
const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8000";

// Define the result interface
interface Match {
  timestamp: number;
  frame_number: number;
  distance: number;
  position: { x: number; y: number; width: number; height: number };
  frame_url?: string;
}

interface TaskResult {
  status: "completed" | "failed" | "processing";
  matches?: Match[];
  match_count?: number;
  error?: string;
}

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

    // Get task ID from request
    const { taskId } = req.query;

    // Wait for processing to complete
    let isComplete = false;
    let result: TaskResult | null = null;
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes (with 5-second intervals)

    while (!isComplete && attempts < maxAttempts) {
      try {
        // Check task status
        const response = await fetch(`${PYTHON_API_URL}/status/${taskId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          attempts++;

          // If we get too many errors, just fail
          if (attempts >= 3) {
            return res.status(response.status).json({
              status: "failed",
              error: `Failed to check task status: ${response.statusText}`,
            });
          }

          // Wait before trying again
          await new Promise((resolve) => setTimeout(resolve, 5000));
          continue;
        }

        const data = (await response.json()) as TaskResult;

        // Check if processing is complete
        if (data.status === "completed" || data.status === "failed") {
          isComplete = true;
          result = data;
        } else {
          // Wait before checking again (5 seconds)
          await new Promise((resolve) => setTimeout(resolve, 5000));
          attempts++;
        }
      } catch (error) {
        attempts++;

        // If we get too many errors, just fail
        if (attempts >= 3) {
          return res.status(500).json({
            status: "failed",
            error:
              error instanceof Error
                ? error.message
                : "Failed to check task status",
          });
        }

        // Wait before trying again
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }

    // If we've reached max attempts without completion
    if (!isComplete) {
      return res.status(504).json({
        status: "failed",
        error:
          "Processing timed out. The video may be too large or complex to process.",
      });
    }

    // Return the result
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error processing video:", error);
    return res.status(500).json({
      status: "failed",
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
}
