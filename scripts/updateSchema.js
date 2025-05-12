import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("Starting schema update...");

  try {
    const userCount = await prisma.user.count();
    console.log(`Found ${userCount} users in database.`);

    try {
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
