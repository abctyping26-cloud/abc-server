import { Schema, model, type Document, Types } from "mongoose";

export interface IAccountingCashAccount extends Document {
  accountName: string;
  description?: string;
  currency: string;
  openingBalance: number;
  status: "active" | "inactive";
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const accountingCashAccountSchema = new Schema<IAccountingCashAccount>(
  {
    accountName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    currency: {
      type: String,
      default: "AED",
      trim: true,
    },
    openingBalance: {
      type: Number,
      default: 0,
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
    collection: "accounting-cash-accounts",
  }
);

accountingCashAccountSchema.index({ accountName: 1, status: 1 });

export const AccountingCashAccount = model<IAccountingCashAccount>(
  "AccountingCashAccount",
  accountingCashAccountSchema
);
