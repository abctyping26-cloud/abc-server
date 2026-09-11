import mongoose from "mongoose";
import { config } from "./index.js";

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
