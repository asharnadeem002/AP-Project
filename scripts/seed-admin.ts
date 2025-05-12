import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const ADMIN_USERS = [
  {
    email: "l217748@lhr.nu.edu.pk",
    username: "admin",
    password: "Admin@123",
    phoneNumber: "+1234567890",
  },
  {
    email: "superadmin@snaptrace.com",
    username: "superadmin",
    password: "SuperAdmin@123",
    phoneNumber: "+1987654321",
  },
];

async function seedAdmins() {
  const prisma = new PrismaClient();

  try {
    console.log("Seeding admin users...");

    const createdAdmins = [];

    for (const adminData of ADMIN_USERS) {
      try {
        const existingAdmin = await prisma.user.findFirst({
          where: {
            OR: [{ email: adminData.email }, { username: adminData.username }],
          },
        });

        if (existingAdmin) {
          createdAdmins.push({
            email: adminData.email,
            username: adminData.username,
            status: "Already exists",
          });
          continue;
        }

        const hashedPassword = await bcrypt.hash(adminData.password, 12);

        const admin = await prisma.user.create({
          data: {
            email: adminData.email,
            username: adminData.username,
            password: hashedPassword,
            phoneNumber: adminData.phoneNumber,
            role: "ADMIN",
            isVerified: true,
            isApproved: true,
          },
        });

        createdAdmins.push({
          email: admin.email,
          username: admin.username,
          status: "Created",
        });
      } catch (err) {
        console.error(`Error creating admin ${adminData.username}:`, err);
      }
    }

    console.log("✅ Admin users seeded successfully:");
    createdAdmins.forEach((admin) => {
      console.log(`- ${admin.username} (${admin.email}): ${admin.status}`);
    });

    console.log("\nYou can now log in with these credentials:");
    console.log("Email: admin@snaptrace.com");
    console.log("Password: Admin@123");
    console.log("\nOr:");
    console.log("Email: superadmin@snaptrace.com");
    console.log("Password: SuperAdmin@123");
  } catch (error) {
    console.error("❌ Error seeding admin users:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedAdmins();
