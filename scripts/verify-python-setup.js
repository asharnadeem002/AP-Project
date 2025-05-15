import { execSync, spawn } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";
import http from "http";

// Get current file path in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set paths
const rootDir = path.resolve(__dirname, "..");
const pythonDir = path.join(rootDir, "python");
const venvDir = path.join(pythonDir, "venv");
const faceApiPath = path.join(pythonDir, "face_api.py");

// Determine the Python command based on the platform
const pythonCommand =
  os.platform() === "win32"
    ? path.join(venvDir, "Scripts", "python.exe")
    : path.join(venvDir, "bin", "python");

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

console.log("Testing Python environment...");

try {
  // Test Python version
  const pythonVersion = execSync(`"${pythonCommand}" --version`, {
    encoding: "utf8",
  });
  console.log(`Using ${pythonVersion.trim()}`);

  // Check if necessary modules are installed
  console.log("Checking required Python modules...");
  const pythonModules = ["fastapi", "uvicorn", "ultralytics", "keras_facenet"];

  for (const moduleName of pythonModules) {
    try {
      execSync(`"${pythonCommand}" -c "import ${moduleName}"`, {
        stdio: "pipe",
      });
      console.log(`✅ ${moduleName} is installed`);
    } catch {
      console.error(`❌ ${moduleName} is NOT installed correctly`);
      process.exit(1);
    }
  }

  // Start the FastAPI server in test mode
  console.log("\nAttempting to start the FastAPI server...");
  const testPort = 8001; // Use a different port for testing

  const pythonProcess = spawn(pythonCommand, [faceApiPath], {
    env: { ...process.env, PORT: String(testPort), HOST: "127.0.0.1" },
  });

  let serverStarted = false;

  pythonProcess.stdout.on("data", (data) => {
    console.log(`Python output: ${data.toString().trim()}`);
    if (data.toString().includes("Application startup complete")) {
      serverStarted = true;
      console.log("✅ FastAPI server started successfully!");

      // Test the API endpoint
      setTimeout(() => {
        http
          .get(`http://127.0.0.1:${testPort}`, (res) => {
            let data = "";

            res.on("data", (chunk) => {
              data += chunk;
            });

            res.on("end", () => {
              console.log(`API Response: ${data}`);
              console.log("✅ API is responding correctly");

              // Terminate the process after successful test
              pythonProcess.kill();
              console.log(
                "\n✅ All tests passed! Your Python setup is working correctly."
              );
              process.exit(0);
            });
          })
          .on("error", (err) => {
            console.error(`❌ Error connecting to API: ${err.message}`);
            pythonProcess.kill();
            process.exit(1);
          });
      }, 2000);
    }
  });

  pythonProcess.stderr.on("data", (data) => {
    console.error(`Python error: ${data.toString().trim()}`);
  });

  // Timeout after 15 seconds if server doesn't start
  setTimeout(() => {
    if (!serverStarted) {
      console.error(
        "❌ Timeout: FastAPI server did not start within the expected time"
      );
      pythonProcess.kill();
      process.exit(1);
    }
  }, 15000);

  pythonProcess.on("close", (code) => {
    if (code !== 0 && !serverStarted) {
      console.error(`❌ Python process exited with code ${code}`);
      process.exit(1);
    }
  });
} catch (error) {
  console.error("Error testing Python environment:", error.message);
  process.exit(1);
}
