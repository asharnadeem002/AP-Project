import React from "react";
import { DashboardLayout } from "../../../../app/components/dashboard/DashboardLayout";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../../../app/components/shared/Card";
import Link from "next/link";

export default function FaceRecognitionIndex() {
  return (
    <DashboardLayout>
      <div className="p-4 space-y-4">
        <h1 className="text-2xl font-bold">Face Recognition</h1>
        <p className="text-lg">
          Use AI to detect and recognize faces in your videos
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Streamlit-Style UI</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                A simplified UI for face recognition similar to Streamlit.
                Upload a reference image and a video to find matching faces.
              </p>
              <Link
                href="/dashboard/user/face-recognition/streamlit-ui"
                className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                Open Streamlit UI
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span>Python API:</span>
                  <PythonApiStatus />
                </div>
                <div className="flex justify-between items-center">
                  <span>YOLO Model:</span>
                  <span className="text-green-500 font-medium">Loaded</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  The face recognition system uses YOLO and FaceNet for
                  detecting and comparing faces.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Technical Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p>
                The face recognition system is implemented using Python and runs
                as a FastAPI service that the Next.js application communicates
                with. Here&apos;s how it works:
              </p>
              <ol className="list-decimal list-inside space-y-2">
                <li>
                  You upload a reference image containing face(s) to search for
                </li>
                <li>You upload a video where you want to find those faces</li>
                <li>
                  The Python API processes both using YOLO for face detection
                </li>
                <li>
                  FaceNet generates embeddings to compare faces accurately
                </li>
                <li>
                  Results show timestamps where matching faces appear in the
                  video
                </li>
              </ol>
              <div className="bg-amber-50 p-4 rounded-md border border-amber-200 mt-4">
                <p className="text-amber-800 font-medium">Troubleshooting</p>
                <p className="text-sm text-amber-700 mt-1">
                  If face recognition is not working, make sure the Python API
                  is running by using:
                  <br />
                  <code className="bg-amber-100 px-2 py-1 rounded text-sm">
                    npm run python:direct
                  </code>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

// Component to check if Python API is running
function PythonApiStatus() {
  const [status, setStatus] = React.useState<"loading" | "online" | "offline">(
    "loading"
  );

  React.useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const response = await fetch("/api/python/face-recognition/status");
        if (response.ok) {
          setStatus("online");
        } else {
          setStatus("offline");
        }
      } catch {
        // Ignore error details and just set status to offline
        setStatus("offline");
      }
    };

    checkApiStatus();
    // Check status every 30 seconds
    const interval = setInterval(checkApiStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (status === "loading") {
    return <span className="text-gray-500 font-medium">Checking...</span>;
  }

  if (status === "online") {
    return <span className="text-green-500 font-medium">Online</span>;
  }

  return <span className="text-red-500 font-medium">Offline</span>;
}
