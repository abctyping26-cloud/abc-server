import { Schema, model, type Document } from "mongoose";

export interface IAdminUser extends Document {
  identifier: string; // Admin ID or email
  password: string; // Hashed password
  role: "admin" | "superadmin" | "master_admin" | "worker_admin";
  name?: string;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const adminUserSchema = new Schema<IAdminUser>(
  {
    identifier: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "superadmin", "master_admin", "worker_admin"],
      default: "worker_admin",
    },
    name: {
      type: String,
      trim: true,
    },
    lastLoginAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: "user-admin", // Explicit collection name as requested
  }
);

export const AdminUser = model<IAdminUser>("AdminUser", adminUserSchema);

export default AdminUser;
