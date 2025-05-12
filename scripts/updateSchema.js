/**
 * This script safely adds the isActive field to existing users
 * and ensures existing admins are marked as active
 */
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("Starting schema update...");

  try {
    // Get a count of all users
    const userCount = await prisma.user.count();
    console.log(`Found ${userCount} users in database.`);

    // First, check if the User table has the isActive field
    // If not present in schema, this query will fail and we can handle accordingly
    try {
      // Add isActive field to all users and set it to true by default
      const updatedUsers = await prisma.$executeRaw`
        UPDATE User 
        SET isActive = true 
        WHERE isActive IS NULL;
      `;
      console.log(
        `Updated ${updatedUsers} users, setting isActive = true (default).`
      );
    } catch (err) {
      console.error(err);
      console.log(
        "Skipping isActive update - field might not exist in schema yet."
      );
      console.log(
        'You may need to run "npx prisma db push" first to add the field.'
      );
    }

    // Add initial values for reactivationRequested field
    try {
      const updatedUsersReactivation = await prisma.$executeRaw`
        UPDATE User 
        SET reactivationRequested = false 
        WHERE reactivationRequested IS NULL;
      `;
      console.log(
        `Updated ${updatedUsersReactivation} users, setting reactivationRequested = false (default).`
      );
    } catch (err) {
      console.error(err);
      console.log(
        "Skipping reactivationRequested update - field might not exist in schema yet."
      );
    }

    // Make sure all admin users are active
    try {
      await prisma.$executeRaw`
        UPDATE User 
        SET isActive = true 
        WHERE role = 'ADMIN';
      `;
      console.log(`Ensured all admin users are active.`);
    } catch (err) {
      console.error(err);
      console.log(
        "Skipping admin activation - field might not exist in schema yet."
      );
    }

    console.log("Schema update complete!");
  } catch (error) {
    console.error("Error updating schema:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
