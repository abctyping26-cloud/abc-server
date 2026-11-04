import { Schema, model, type Document, Types } from "mongoose";

export interface IPhoneEntry {
  e164: string;
  isPrimary: boolean;
  label?: string;
}

export interface IClinicalFile {
  _id?: Types.ObjectId;
  public_id: string;
  url: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  category: "scan" | "lab_report" | "prescription" | "consent_form" | "general";
  uploadedAt: Date;
  uploadedBy?: Types.ObjectId;
}

export interface IPretheekshaUser extends Document {
  code: string;
  fullName: string;
  searchName: string;
  dateOfBirth: Date;
  sex: "female" | "male" | "intersex" | "unspecified";
  bloodGroup?: string;
  phones: IPhoneEntry[];
  email?: string;
  address?: {
    line1?: string;
    city?: string;
    state?: string;
    pin?: string;
  };
  allergies: string[];
  medicalHistory?: string;
  files: IClinicalFile[];
  deletedAt?: Date | null;
  deletedBy?: Types.ObjectId | null;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const phoneEntrySchema = new Schema<IPhoneEntry>(
  {
    e164: { type: String, required: true, trim: true },
    isPrimary: { type: Boolean, default: false },
    label: { type: String, default: "mobile" },
  },
  { _id: false }
);

const clinicalFileSchema = new Schema<IClinicalFile>(
  {
    public_id: { type: String, required: true },
    url: { type: String, required: true },
    fileName: { type: String, required: true, trim: true },
    fileType: { type: String, default: "application/octet-stream" },
    fileSize: { type: Number, default: 0 },
    category: {
      type: String,
      enum: ["scan", "lab_report", "prescription", "consent_form", "general"],
      default: "general",
    },
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "AdminUser" },
  },
  { _id: true }
);

const pretheekshaUserSchema = new Schema<IPretheekshaUser>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    searchName: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    sex: {
      type: String,
      enum: ["female", "male", "intersex", "unspecified"],
      required: true,
    },
    bloodGroup: {
      type: String,
      trim: true,
      default: "",
    },
    phones: {
      type: [phoneEntrySchema],
      default: [],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    address: {
      line1: { type: String, default: "", trim: true },
      city: { type: String, default: "", trim: true },
      state: { type: String, default: "", trim: true },
      pin: { type: String, default: "", trim: true },
    },
    allergies: {
      type: [String],
      default: [],
    },
    medicalHistory: {
      type: String,
      default: "",
      trim: true,
    },
    files: {
      type: [clinicalFileSchema],
      default: [],
    },
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: "AdminUser",
      default: null,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "AdminUser",
    },
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
    collection: "user-preth",
  }
);

// Indexes for ultra-fast lookup
pretheekshaUserSchema.index({ "phones.e164": 1 });
pretheekshaUserSchema.index({ searchName: 1 });
pretheekshaUserSchema.index({ deletedAt: 1, createdAt: -1 });

export const PretheekshaUser = model<IPretheekshaUser>(
  "PretheekshaUser",
  pretheekshaUserSchema
);

export default PretheekshaUser;
