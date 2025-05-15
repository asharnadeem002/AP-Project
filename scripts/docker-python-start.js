import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

// Get current file path in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

console.log("🐍 Starting Python Face Recognition API in Docker...");

try {
  // Check if Docker is installed
  try {
    execSync("docker --version", { stdio: "pipe" });
    console.log("✅ Docker is installed");
  } catch (error) {
    console.error("❌ Docker is not installed. Please install Docker first.");
    process.exit(1);
  }

  // Check if docker-compose is installed
  try {
    execSync("docker-compose --version", { stdio: "pipe" });
    console.log("✅ Docker Compose is installed");
  } catch (error) {
    console.error(
      "❌ Docker Compose is not installed. Please install Docker Compose first."
    );
    process.exit(1);
  }

  // Build and start the Docker container
  console.log("🔨 Building and starting Docker container...");
  execSync("docker-compose up -d --build", {
    cwd: rootDir,
    stdio: "inherit",
  });

  // Wait for the container to be ready
  console.log("⏳ Waiting for the Python API to be ready...");

  // Simple polling to check if the API is responding
  let attempts = 0;
  const maxAttempts = 30;
  let apiReady = false;

  while (!apiReady && attempts < maxAttempts) {
    try {
      execSync(
        "curl -s -o /dev/null -w '%{http_code}' http://localhost:8000/",
        { stdio: "pipe" }
      );
      apiReady = true;
      console.log("✅ Python API is ready at http://localhost:8000");
    } catch (error) {
      attempts++;
      if (attempts >= maxAttempts) {
        console.error(
          "❌ Python API did not start properly after multiple attempts"
        );
        console.log("📋 Checking container logs for errors:");
        execSync("docker-compose logs face-api", {
          cwd: rootDir,
          stdio: "inherit",
        });
        process.exit(1);
      }
      // Wait for 2 seconds before trying again
      console.log(
        `⏳ Waiting for API to be ready... (attempt ${attempts}/${maxAttempts})`
      );
      execSync("timeout /t 2", { shell: true, stdio: "ignore" });
    }
  }

  console.log("✅ Python Face Recognition API is running in Docker");
  console.log("ℹ️  Use 'npm run python:stop' to stop the Docker container");
} catch (error) {
  console.error("❌ Error starting Python API in Docker:", error.message);
  process.exit(1);
}
