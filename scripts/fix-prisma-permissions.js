import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

// Get current file path in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

console.log("🔧 Fixing Prisma permissions issues...");

try {
  // Clean Prisma cache
  const prismaDir = path.join(rootDir, "node_modules", ".prisma");

  if (fs.existsSync(prismaDir)) {
    console.log("🧹 Cleaning Prisma cache directory...");
    try {
      fs.rmSync(prismaDir, { recursive: true, force: true });
      console.log("✅ Prisma cache cleaned");
    } catch (err) {
      console.error("⚠️ Could not clean Prisma cache directory:", err.message);
    }
  }

  // Close any running Node processes that might be locking files
  console.log("🔄 Closing any Node processes that might be locking files...");
  try {
    execSync("taskkill /f /im node.exe", { stdio: "ignore" });
  } catch {
    // Ignore errors, as this might fail if no Node processes are running
  }

  // Run Prisma generate with --force flag
  console.log("🔄 Generating Prisma client with --force flag...");
  try {
    execSync("npx prisma generate --force", { stdio: "inherit" });
    console.log("✅ Prisma client generated successfully");
  } catch (err) {
    console.error("❌ Failed to generate Prisma client:", err.message);
    console.log("\n");
    console.log("Please try running the command manually as administrator:");
    console.log("1. Close VS Code or any editor that might be using the files");
    console.log("2. Open command prompt as administrator");
    console.log(`3. Navigate to ${rootDir}`);
    console.log("4. Run: npx prisma generate --force");
  }
} catch (error) {
  console.error("❌ Error fixing Prisma permissions:", error.message);
}
