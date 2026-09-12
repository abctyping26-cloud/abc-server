import { Schema, model, type Document } from "mongoose";

export interface IEnquiry extends Document {
  name: string;
  email: string;
  phone: string;
  service: string;
  otherService?: string;
  status: "pending" | "responded";
  submittedAt: Date;
  respondedBy?: string;
  respondedByRole?: "master_admin" | "worker_admin" | "superadmin" | "admin";
  respondedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const enquirySchema = new Schema<IEnquiry>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    service: {
      type: String,
      required: true,
      trim: true,
    },
    otherService: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "responded"],
      default: "pending",
      index: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    respondedBy: {
      type: String,
      trim: true,
    },
    respondedByRole: {
      type: String,
      enum: ["master_admin", "worker_admin", "superadmin", "admin"],
    },
    respondedAt: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: "enquiries",
  }
);

export const Enquiry = model<IEnquiry>("Enquiry", enquirySchema);

export default Enquiry;
