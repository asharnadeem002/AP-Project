import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import os from "os";
import { fileURLToPath } from "url";

// Get current file path in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set paths
const rootDir = path.resolve(__dirname, "..");
const pythonDir = path.join(rootDir, "python");
const venvDir = path.join(pythonDir, "venv");
const faceApiPath = path.join(pythonDir, "face_api.py");

// Determine Python path based on OS
const pythonCommand =
  os.platform() === "win32"
    ? path.join(venvDir, "Scripts", "python.exe")
    : path.join(venvDir, "bin", "python");

// Config for the Python API
const PORT = process.env.PYTHON_API_PORT || 8000;
const HOST = process.env.PYTHON_API_HOST || "127.0.0.1";

// Track the Python process globally so we can terminate it
let pythonProcess = null;

// Check if virtual environment exists
if (!fs.existsSync(venvDir)) {
  console.error(
    "Python virtual environment not found. Please run 'npm run setup:python' first."
  );
  process.exit(1);
}

// Check if the face_api.py file exists
if (!fs.existsSync(faceApiPath)) {
  console.error(`Python API file not found at ${faceApiPath}`);
  process.exit(1);
}

// Function to start the Python API
function startPythonApi() {
  console.log(
    `🔵 Starting Python Face Recognition API on http://${HOST}:${PORT}`
  );

  const env = {
    ...process.env,
    PORT: String(PORT),
    HOST,
    MODEL_PATH: path.join(rootDir, "public", "best.pt"),
  };

  // Start the Python process
  pythonProcess = spawn(pythonCommand, [faceApiPath], {
    env,
    stdio: ["ignore", "pipe", "pipe"],
    cwd: pythonDir,
  });

  let serverStarted = false;

  // Handle Python process output
  pythonProcess.stdout.on("data", (data) => {
    const output = data.toString().trim();
    console.log(`Python API: ${output}`);

    // Check if server has started
    if (
      output.includes("Application startup complete") ||
      output.includes("Uvicorn running on") ||
      output.includes("Started server process")
    ) {
      serverStarted = true;
      console.log(`✅ Python API is running at http://${HOST}:${PORT}`);
    }
  });

  pythonProcess.stderr.on("data", (data) => {
    const output = data.toString().trim();
    if (
      output.toLowerCase().includes("error") ||
      output.toLowerCase().includes("exception")
    ) {
      console.error(`❌ Python API error: ${output}`);
    } else {
      console.log(`Python API: ${output}`);
    }
  });

  pythonProcess.on("close", (code) => {
    console.log(`Python API process exited with code ${code}`);
    pythonProcess = null;
  });

  // Handle process termination
  process.on("SIGINT", () => {
    console.log("\n🛑 Stopping Python API...");
    if (pythonProcess) {
      pythonProcess.kill();
    }
    process.exit(0);
  });

  // Timeout check for server startup
  setTimeout(() => {
    if (!serverStarted) {
      console.log(
        "⚠️ Python API may not have started properly. Check for errors above."
      );
    }
  }, 10000);
}

// Start the server
startPythonApi();
