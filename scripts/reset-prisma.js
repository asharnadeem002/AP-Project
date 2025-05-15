import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

// Get current file path in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

console.log("🔧 Resetting Prisma client...");

try {
  // Clean Prisma caches
  const prismaDir = path.join(rootDir, "node_modules", ".prisma");

  if (fs.existsSync(prismaDir)) {
    console.log("🧹 Cleaning Prisma cache directory...");
    try {
      fs.rmSync(prismaDir, { recursive: true, force: true });
      console.log("✅ Prisma cache cleaned");
    } catch (error) {
      console.error(
        "⚠️ Could not clean Prisma cache directory:",
        error.message
      );
    }
  }

  // Close any running Node processes that might be locking files
  console.log("🔄 Closing any Node processes that might be locking files...");
  try {
    execSync("taskkill /f /im node.exe", { stdio: "ignore" });
  } catch {
    // Ignore errors, as this might fail if no Node processes are running
  }

  // Run Prisma generate with explicit schema path
  console.log("🔄 Generating Prisma client with explicit schema path...");
  try {
    execSync("npx prisma generate --schema=./prisma/schema.prisma", {
      stdio: "inherit",
      cwd: rootDir,
    });
    console.log("✅ Prisma client generated successfully");
  } catch (error) {
    console.error("❌ Failed to generate Prisma client:", error.message);
    process.exit(1);
  }

  console.log(
    "\n✅ Prisma client reset successfully! Please restart your Next.js server."
  );
} catch (error) {
  console.error("❌ Error resetting Prisma client:", error.message);
  process.exit(1);
}
