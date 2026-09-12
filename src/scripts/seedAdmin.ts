import bcrypt from "bcryptjs";
import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { AdminUser } from "../models/adminUser.model.js";

const seedAdmin = async () => {
  console.log("🌱 Initializing admin seed script...");
  await connectDatabase();

  const identifier =
    process.argv[2] ||
    process.env.INITIAL_ADMIN_EMAIL ||
    "masteradmin@abc.com";
  const rawPassword =
    process.argv[3] || process.env.INITIAL_ADMIN_PASSWORD || "Arun@2026";
  const role =
    identifier.toLowerCase() === "masteradmin@abc.com"
      ? "master_admin"
      : "superadmin";

  const normalizedIdentifier = identifier.trim().toLowerCase();

  try {
    const existingAdmin = await AdminUser.findOne({
      identifier: normalizedIdentifier,
    });

    if (existingAdmin) {
      console.log(
        `ℹ️ Admin "${normalizedIdentifier}" already exists in 'user-admin'. No action needed.`
      );
    } else {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(rawPassword, salt);

      await AdminUser.create({
        identifier: normalizedIdentifier,
        password: hashedPassword,
        role: role as "master_admin" | "superadmin",
        name: role === "master_admin" ? "Master Admin" : "Super Administrator",
      });

      console.log(`✅ Admin account created successfully in 'user-admin':`);
      console.log(`   Identifier: ${normalizedIdentifier}`);
      console.log(`   Password:   ${rawPassword}`);
      console.log(`   Role:       ${role}`);
    }
  } catch (error) {
    console.error("❌ Failed to seed admin account:", error);
  } finally {
    await disconnectDatabase();
    process.exit(0);
  }
};

seedAdmin();
