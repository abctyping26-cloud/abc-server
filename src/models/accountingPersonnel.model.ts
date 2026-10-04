import { Schema, model, type Document, Types } from "mongoose";

export type PersonnelType = "salesman" | "referrer" | "division" | "supplier";

export interface IAccountingPersonnel extends Document {
  type: PersonnelType;
  name: string;
  phone?: string;
  code?: string;
  email?: string;
  address?: string;
  category?: string;
  notes?: string;
  status: "active" | "inactive";
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const accountingPersonnelSchema = new Schema<IAccountingPersonnel>(
  {
    type: {
      type: String,
      enum: ["salesman", "referrer", "division", "supplier"],
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    code: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      trim: true,
      default: "",
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    category: {
      type: String,
      trim: true,
      default: "",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "AdminUser",
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "accounting-personnel",
  }
);

export const AccountingPersonnel = model<IAccountingPersonnel>(
  "AccountingPersonnel",
  accountingPersonnelSchema
);

export default AccountingPersonnel;
