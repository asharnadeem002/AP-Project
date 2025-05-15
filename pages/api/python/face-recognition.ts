import { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import { verifyJwt } from "../../../app/lib/jwt";
import fetch from "node-fetch";
import { IncomingForm } from "formidable";

// Configure API to handle form data
export const config = {
  api: {
    bodyParser: false,
  },
};

// Python API URL
const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8000";

// Check if the Python API is running
async function isPythonApiRunning() {
  try {
    const response = await fetch(PYTHON_API_URL, {
      method: "GET",
    });
    return response.ok;
  } catch (error) {
    console.error(
      `Error connecting to Python API at ${PYTHON_API_URL}:`,
      error
    );
    return false;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Verify JWT authentication
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

    // Check if the Python API is running
    const apiRunning = await isPythonApiRunning();
    if (!apiRunning) {
      return res.status(503).json({
        message: "Python API is not available. Make sure the API is running.",
        hint: "Run 'npm run python:direct' to start the Python API directly.",
      });
    }

    // Handle different API routes based on the HTTP method and path
    if (req.method === "POST" && req.url?.endsWith("/face-recognition")) {
      // Process video request
      try {
        // Parse form data with formidable
        const form = new IncomingForm();

        // Use a Promise to handle the form parsing with proper error handling
        const formData = await new Promise<{ files: unknown }>(
          (resolve, reject) => {
            form.parse(req, (err, _fields, files) => {
              if (err) return reject(err);
              resolve({ files });
            });
          }
        );

        // Safely cast the files to an object with filepath, originalFilename properties
        const refImage = getFormFile(formData.files, "referenceImage");
        const videoFile = getFormFile(formData.files, "videoFile");

        if (!refImage || !videoFile) {
          return res.status(400).json({
            message: "Missing or invalid reference image or video file",
          });
        }

        // Create form data for Python API
        const apiFormData = new FormData();

        // Add files to form data
        apiFormData.append(
          "reference_image",
          new Blob([fs.readFileSync(refImage.filepath)]),
          refImage.originalFilename || "reference.jpg"
        );

        apiFormData.append(
          "video_file",
          new Blob([fs.readFileSync(videoFile.filepath)]),
          videoFile.originalFilename || "video.mp4"
        );

        // Forward request to Python API
        const apiResponse = await fetch(`${PYTHON_API_URL}/process`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: apiFormData,
        });

        if (!apiResponse.ok) {
          const errorData = await apiResponse.json();
          return res.status(apiResponse.status).json(errorData);
        }

        const data = await apiResponse.json();
        return res.status(200).json(data);
      } catch (error) {
        console.error("Error processing video:", error);
        return res
          .status(500)
          .json({ message: "Error processing video", error: String(error) });
      }
    } else if (req.method === "GET" && req.url?.includes("/status/")) {
      // Get task status
      const taskId = req.url.split("/status/")[1];

      try {
        const apiResponse = await fetch(`${PYTHON_API_URL}/status/${taskId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!apiResponse.ok) {
          const errorData = await apiResponse.json();
          return res.status(apiResponse.status).json(errorData);
        }

        const data = await apiResponse.json();
        return res.status(200).json(data);
      } catch (error) {
        console.error("Error getting task status:", error);
        return res
          .status(500)
          .json({ message: "Error getting task status", error: String(error) });
      }
    } else if (req.method === "GET" && req.url?.includes("/frame/")) {
      // Get a frame image
      const parts = req.url.split("/frame/")[1].split("/");
      if (parts.length !== 2) {
        return res
          .status(400)
          .json({ message: "Invalid frame request format" });
      }

      const taskId = parts[0];
      const frameId = parts[1];

      try {
        const apiResponse = await fetch(
          `${PYTHON_API_URL}/frame/${taskId}/${frameId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!apiResponse.ok) {
          const errorData = await apiResponse.json();
          return res.status(apiResponse.status).json(errorData);
        }

        // If this was returning an image file, you would stream it to the response
        // For now, just return the JSON response
        const data = await apiResponse.json();
        return res.status(200).json(data);
      } catch (error) {
        console.error("Error getting frame:", error);
        return res
          .status(500)
          .json({ message: "Error getting frame", error: String(error) });
      }
    } else {
      return res.status(404).json({ message: "API route not found" });
    }
  } catch (error) {
    console.error("Face recognition API error:", error);
    return res.status(500).json({
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
}

/**
 * Helper function to safely extract a file from formidable's files object
 */
function getFormFile(
  files: unknown,
  fieldName: string
): { filepath: string; originalFilename?: string } | null {
  if (!files || typeof files !== "object") return null;

  const filesObj = files as Record<string, unknown>;
  const file = filesObj[fieldName];

  if (!file) return null;

  // Handle both single file and array of files
  if (Array.isArray(file)) {
    if (file.length === 0) return null;

    const firstFile = file[0];
    if (!firstFile || typeof firstFile !== "object") return null;

    const typedFile = firstFile as {
      filepath?: string;
      originalFilename?: string;
    };
    if (!typedFile.filepath) return null;

    return {
      filepath: typedFile.filepath,
      originalFilename: typedFile.originalFilename,
    };
  }

  // Handle single file case
  if (typeof file !== "object") return null;

  const typedFile = file as { filepath?: string; originalFilename?: string };
  if (!typedFile.filepath) return null;

  return {
    filepath: typedFile.filepath,
    originalFilename: typedFile.originalFilename,
  };
}
