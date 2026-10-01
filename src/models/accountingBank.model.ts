import { Schema, model, type Document, Types } from "mongoose";

export interface IAccountingBank extends Document {
  bankName: string;
  accountName?: string;
  accountNumber?: string;
  iban?: string;
  swiftCode?: string;
  currency: string;
  openingBalance: number;
  status: "active" | "inactive";
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const accountingBankSchema = new Schema<IAccountingBank>(
  {
    bankName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    accountName: {
      type: String,
      trim: true,
      default: "",
    },
    accountNumber: {
      type: String,
      trim: true,
      default: "",
    },
    iban: {
      type: String,
      trim: true,
      default: "",
    },
    swiftCode: {
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
    collection: "accounting-banks",
  }
);

accountingBankSchema.index({ bankName: 1, status: 1 });

export const AccountingBank = model<IAccountingBank>("AccountingBank", accountingBankSchema);
