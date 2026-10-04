import { Schema, model, type Document, Types } from "mongoose";

export interface IAccountingIncome extends Document {
  incomeId: string;
  incomeDate: Date;
  type: string;
  description: string;
  amount: number;
  payMode: "cash" | "bank";
  bank?: string;
  division?: string;
  status: "received" | "cleared" | "pending";
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const accountingIncomeSchema = new Schema<IAccountingIncome>(
  {
    incomeId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    incomeDate: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    type: {
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
    amount: {
      type: Number,
      required: true,
      default: 0,
    },
    payMode: {
      type: String,
      enum: ["cash", "bank"],
      default: "cash",
      index: true,
    },
    bank: {
      type: String,
      trim: true,
      default: "",
    },
    division: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["received", "cleared", "pending"],
      default: "received",
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
    collection: "accounting-incomes",
  }
);

export const AccountingIncome = model<IAccountingIncome>(
  "AccountingIncome",
  accountingIncomeSchema
);
