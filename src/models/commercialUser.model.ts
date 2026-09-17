import { Schema, model, type Document, Types } from "mongoose";

export interface IClientFile {
  _id?: Types.ObjectId;
  public_id: string;
  url: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: Date;
  uploadedBy?: Types.ObjectId;
}

export interface IClientPhoto {
  public_id: string;
  url: string;
}

export interface ICommercialUser extends Document {
  identifier: string; // Unique lookup identifier (email, phone, or auto-generated client ID)
  password?: string; // Hashed password (optional for offline/manually added clients)
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  pin?: string;
  completed: boolean; // Service completed status (true / false)
  photo?: IClientPhoto;
  files: IClientFile[]; // Unlimited client attachments stored in Cloudinary
  source: "website" | "manual"; // Registered online vs manually entered by admin
  createdBy?: Types.ObjectId; // Reference to AdminUser who created the record (null for website users)
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const clientFileSchema = new Schema<IClientFile>(
  {
    public_id: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    fileType: {
      type: String,
      default: "application/octet-stream",
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "AdminUser",
    },
  },
  { _id: true }
);

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
      required: false,
      default: "",
    },
    name: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      sparse: true,
      index: true,
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    pin: {
      type: String,
      trim: true,
      default: "",
    },
    completed: {
      type: Boolean,
      default: false,
      index: true,
    },
    photo: {
      public_id: { type: String },
      url: { type: String },
    },
    files: {
      type: [clientFileSchema],
      default: [],
    },
    source: {
      type: String,
      enum: ["website", "manual"],
      default: "manual",
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "AdminUser",
      index: true,
      default: null,
    },
    lastLoginAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: "user-commercial", // Explicit collection name
  }
);

export const CommercialUser = model<ICommercialUser>(
  "CommercialUser",
  commercialUserSchema
);

export default CommercialUser;
