import { Schema, model, type Document } from "mongoose";

export interface ICommercialUser extends Document {
  identifier: string; // Email, phone, or username
  password: string; // Hashed password
  name?: string;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const commercialUserSchema = new Schema<ICommercialUser>(
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
    collection: "user-commercial", // Explicit collection name as requested
  }
);

export const CommercialUser = model<ICommercialUser>(
  "CommercialUser",
  commercialUserSchema
);

export default CommercialUser;
