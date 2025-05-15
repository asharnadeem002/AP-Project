import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

// Get current file path in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

console.log("🛑 Stopping Python Face Recognition API in Docker...");

try {
  // Check if Docker is installed
  try {
    execSync("docker --version", { stdio: "pipe" });
  } catch (error) {
    console.error("❌ Docker is not installed. Cannot stop containers.", error);
    process.exit(1);
  }

  // Stop the Docker container
  console.log("🔽 Stopping Docker container...");
  execSync("docker-compose down", {
    cwd: rootDir,
    stdio: "inherit",
  });

  console.log("✅ Python Face Recognition API Docker container stopped");
} catch (error) {
  console.error("❌ Error stopping Python API in Docker:", error.message);
  process.exit(1);
}
