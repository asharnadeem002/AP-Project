import React, { useState, useEffect } from "react";
import { DashboardLayout } from "../../../../app/components/dashboard/DashboardLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../../app/components/shared/Card";
import Image from "next/image";
import { toast } from "react-toastify";

interface Match {
  timestamp: number;
  frame_number: number;
  distance: number;
  position: { x: number; y: number; width: number; height: number };
  frame_url?: string;
  image_data?: string; // For storing base64 encoded images
}

interface ProcessingResult {
  status: "completed" | "failed" | "processing";
  matches: Match[];
  match_count: number;
  error?: string;
}

// Helper function to store images in localStorage
const storeFrameImage = (key: string, imageData: string) => {
  try {
    localStorage.setItem(key, imageData);
  } catch (error) {
    console.error("Error storing image data:", error);
    // If localStorage is full, clear old images
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      // Clear oldest stored images (first 10)
      const keys = Object.keys(localStorage).filter((k) =>
        k.startsWith("frame_")
      );
      keys.slice(0, 10).forEach((k) => localStorage.removeItem(k));

      // Try storing again
      try {
        localStorage.setItem(key, imageData);
      } catch {
        console.error("Still couldn't store image after clearing space");
      }
    }
  }
};

// Helper function to retrieve images from localStorage
const getStoredFrameImage = (key: string): string | null => {
  return localStorage.getItem(key);
};

export default function StreamlitStyleUI() {
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      // No cleanup needed now
    };
  }, []);

  // Function to fetch an image and convert it to base64
  const fetchImageAsBase64 = async (url: string): Promise<string> => {
    try {
      const storageKey = `frame_${url.split("/").slice(-2).join("_")}`;
      // Try to get from localStorage first
      const cachedImage = getStoredFrameImage(storageKey);
      if (cachedImage) {
        return cachedImage;
      }

      // Otherwise fetch it
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch image");
      }

      // Check if we got a placeholder JSON instead of an image
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        // Return a data URL for a default placeholder image
        // This is a simple gray box with text indicating it's a placeholder
        return generatePlaceholderImage(url.split("/").pop() || "unknown");
      }

      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === "string") {
            // Store in localStorage for later use
            storeFrameImage(storageKey, reader.result);
            resolve(reader.result);
          } else {
            reject(new Error("Failed to convert image to base64"));
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Error fetching image:", error);
      // Return a placeholder image on error
      return generatePlaceholderImage(url.split("/").pop() || "unknown");
    }
  };

  // Generate a placeholder image with text as a data URL
  const generatePlaceholderImage = (frameId: string): string => {
    // Create a canvas element
    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 300;

    // Get the canvas context and draw a placeholder
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    // Fill with gray background
    ctx.fillStyle = "#f0f0f0";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add text
    ctx.fillStyle = "#666666";
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
      `Frame ${frameId} (placeholder)`,
      canvas.width / 2,
      canvas.height / 2
    );
    ctx.fillText(
      `Match found but image not available`,
      canvas.width / 2,
      canvas.height / 2 + 30
    );

    // Return as data URL
    return canvas.toDataURL("image/png");
  };

  // Direct fetch that resolves when complete
  const fetchTaskResult = async (taskId: string) => {
    try {
      const response = await fetch(
        `/api/python/face-recognition/process-and-wait/${taskId}`
      );

      if (!response.ok) {
        throw new Error("Failed to process video");
      }

      const data = (await response.json()) as ProcessingResult;

      // If we have matches with frame URLs, fetch the actual images
      if (
        data.status === "completed" &&
        data.matches &&
        data.matches.length > 0
      ) {
        // Process in batches to avoid overwhelming the browser
        const enhancedMatches = [...data.matches];

        // Process images in smaller batches
        const batchSize = 2;
        for (let i = 0; i < enhancedMatches.length; i += batchSize) {
          try {
            const batch = enhancedMatches.slice(i, i + batchSize);
            await Promise.all(
              batch.map(async (match, idx) => {
                try {
                  if (match.frame_url) {
                    const imageData = await fetchImageAsBase64(match.frame_url);
                    if (imageData) {
                      enhancedMatches[i + idx].image_data = imageData;
                    }
                  }
                } catch (batchError) {
                  console.error(
                    `Error processing match ${i + idx}:`,
                    batchError
                  );
                  // Continue with other matches even if one fails
                }
              })
            );

            // Update state after each batch so the UI updates incrementally
            setMatches([...enhancedMatches.slice(0, i + batchSize)]);

            // Small delay to let the UI breathe between batches
            if (i + batchSize < enhancedMatches.length) {
              await new Promise((resolve) => setTimeout(resolve, 100));
            }
          } catch (batchError) {
            console.error(
              `Error processing batch starting at ${i}:`,
              batchError
            );
            // Continue with next batch even if current one fails
          }
        }

        // Ensure all matches are in the state
        setMatches([...enhancedMatches]);
      } else {
        // If no matches or processing failed, use the matches from the result
        setMatches(data.matches || []);
      }

      setIsProcessing(false);
      setResult(data);

      if (data.status === "completed") {
        toast.success(
          `Person detected ${data.match_count} times in the video!`
        );
      } else {
        toast.error(`Processing failed: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      setIsProcessing(false);
      console.error("Error processing video:", error);
      toast.error("Failed to process video. Please try again.");
    }
  };

  const handleReferenceImageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files && e.target.files.length > 0) {
      setReferenceImage(e.target.files[0]);
    }
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setVideoFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!referenceImage || !videoFile) {
      toast.error("Please upload both a reference image and a video file");
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setResult(null);
    setMatches([]);

    try {
      const formData = new FormData();
      formData.append("referenceImage", referenceImage);
      formData.append("videoFile", videoFile);

      const response = await fetch("/api/python/face-recognition", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to process video");
      }

      const data = await response.json();
      toast.info("Processing started. This may take a while...");

      // Directly fetch the complete result instead of polling
      await fetchTaskResult(data.task_id);
    } catch (error) {
      setIsProcessing(false);
      toast.error(error instanceof Error ? error.message : "An error occurred");
      console.error("Error processing video:", error);
    }
  };

  // Render the match image from either the server URL or cached base64
  const renderMatchImage = (match: Match) => {
    if (match.image_data) {
      return (
        <div className="relative h-96 w-full">
          <Image
            src={match.image_data}
            alt={`Match at ${match.timestamp.toFixed(2)} seconds`}
            fill
            style={{ objectFit: "contain" }}
          />
        </div>
      );
    } else if (match.frame_url) {
      return (
        <div className="relative h-96 w-full">
          <Image
            src={match.frame_url}
            alt={`Match at ${match.timestamp.toFixed(2)} seconds`}
            fill
            style={{ objectFit: "contain" }}
          />
        </div>
      );
    } else {
      return (
        <div className="h-96 w-full flex items-center justify-center bg-gray-100">
          <p className="text-gray-500">Frame image not available</p>
        </div>
      );
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              Face Recognition System with Video Input
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center mb-6">
              Upload a reference image and a video file. The system will detect
              persons in the video and compare them with the reference image.
            </p>

            <form
              onSubmit={handleSubmit}
              className="space-y-6 max-w-3xl mx-auto"
            >
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Upload a reference image (containing faces to match)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/jpg"
                  onChange={handleReferenceImageChange}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-medium
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                  disabled={isProcessing}
                />
                {referenceImage && (
                  <div className="mt-2 relative h-40 w-full max-w-xs mx-auto border rounded-md overflow-hidden">
                    <Image
                      src={URL.createObjectURL(referenceImage)}
                      alt="Reference"
                      fill
                      style={{ objectFit: "contain" }}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Upload a video file
                </label>
                <input
                  type="file"
                  accept="video/mp4,video/avi,video/mov"
                  onChange={handleVideoFileChange}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-medium
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                  disabled={isProcessing}
                />
                {videoFile && (
                  <div className="mt-2 max-w-xs mx-auto">
                    <video
                      src={URL.createObjectURL(videoFile)}
                      controls
                      className="w-full h-40 border rounded-md"
                    />
                  </div>
                )}
              </div>

              <div className="text-center">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                  disabled={isProcessing || !referenceImage || !videoFile}
                >
                  {isProcessing ? "Processing..." : "Process Video"}
                </button>
              </div>
            </form>

            {isProcessing && (
              <div className="mt-6">
                <p className="text-center font-medium mb-2">
                  Processing video... This may take a moment.
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {result && result.status === "completed" && (
              <div className="mt-8">
                {matches.length > 0 ? (
                  <div>
                    <div className="text-center mb-4">
                      <div className="inline-flex items-center px-4 py-2 font-semibold text-sm bg-green-100 text-green-800 rounded-full">
                        Person detected {matches.length} times in the video!
                      </div>
                    </div>

                    <div className="space-y-6">
                      {matches.map((match, index) => (
                        <div
                          key={index}
                          className="border rounded-lg overflow-hidden shadow-sm"
                        >
                          <div className="p-4 bg-gray-50 border-b">
                            <h3 className="font-medium">
                              Match {index + 1}: Detected at{" "}
                              {match.timestamp.toFixed(2)} seconds (distance:{" "}
                              {match.distance.toFixed(4)})
                            </h3>
                          </div>
                          <div className="p-4">{renderMatchImage(match)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center mt-8">
                    <div className="inline-flex items-center px-4 py-2 font-semibold text-sm bg-red-100 text-red-800 rounded-full">
                      No matching person found in the video.
                    </div>
                  </div>
                )}
              </div>
            )}

            {result && result.status === "failed" && (
              <div className="mt-8 text-center">
                <div className="inline-flex items-center px-4 py-2 font-semibold text-sm bg-red-100 text-red-800 rounded-full">
                  Error: {result.error || "Processing failed"}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
