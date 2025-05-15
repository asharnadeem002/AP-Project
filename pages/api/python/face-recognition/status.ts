import { NextApiRequest, NextApiResponse } from "next";
import fetch from "node-fetch";

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
    // Attempt to connect to the Python API with a short timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(PYTHON_API_URL, {
      method: "GET",
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    if (response.ok) {
      return res.status(200).json({ status: "online" });
    } else {
      return res
        .status(503)
        .json({ status: "offline", message: "API responded with error" });
    }
  } catch (error) {
    console.error("Error checking Python API status:", error);
    return res.status(503).json({
      status: "offline",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
