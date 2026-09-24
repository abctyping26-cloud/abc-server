import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { config } from "./index.js";
import { AdminUser } from "../models/adminUser.model.js";

import { ensureServicesSeeded } from "../services/serviceSeed.service.js";

/**
 * Ensures that the master admin account exists in 'user-admin' collection.
 */
const ensureMasterAdmin = async (): Promise<void> => {
  try {
    const existing = await AdminUser.findOne({
      identifier: "masteradmin@abc.com",
    });
    if (!existing) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("Arun@2026", salt);
      await AdminUser.create({
        identifier: "masteradmin@abc.com",
        password: hashedPassword,
        role: "master_admin",
        name: "Master Admin",
        profileCompleted: true,
        isFirstLogin: false,
      });
      console.log("✅ Seeded master admin (masteradmin@abc.com) in 'user-admin' collection.");
    }
  } catch (err) {
    console.error("⚠️ Failed to ensure master admin on startup:", err);
  }
};

export const connectDatabase = async (): Promise<void> => {
  try {
    mongoose.connection.on("connected", () => {
      console.log(" MongoDB connection established successfully");
    });

    mongoose.connection.on("error", (err: unknown) => {
      console.error("❌ MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️ MongoDB connection lost. Reconnecting...");
    });

    await mongoose.connect(config.mongoUri);
    await ensureMasterAdmin();
    await ensureServicesSeeded();
  } catch (error) {
    console.error("❌ Failed to connect to MongoDB:", error);
    // In production, you may want to exit process if DB is critical
    if (config.isProduction) {
      process.exit(1);
    }
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    console.log("🔒 MongoDB connection closed.");
  } catch (error) {
    console.error("❌ Error while closing MongoDB connection:", error);
  }
};

export default connectDatabase;
