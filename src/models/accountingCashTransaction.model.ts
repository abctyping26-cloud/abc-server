import { Schema, model, type Document, Types } from "mongoose";

export interface IAccountingCashTransaction extends Document {
  txType: "Cash In" | "Cash Out" | "Deposit to Bank" | "Withdrawal from Bank";
  txDate: Date;
  accountName: string;
  amount: number;
  customerOrParty?: string;
  category?: string;
  reference?: string;
  description?: string;
  toBank?: string;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const accountingCashTransactionSchema = new Schema<IAccountingCashTransaction>(
  {
    txType: {
      type: String,
      enum: ["Cash In", "Cash Out", "Deposit to Bank", "Withdrawal from Bank"],
      required: true,
      index: true,
    },
    txDate: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    accountName: {
      type: String,
      required: true,
      trim: true,
      default: "Main Cash",
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    customerOrParty: {
      type: String,
      trim: true,
      default: "",
    },
    category: {
      type: String,
      trim: true,
      default: "General",
    },
    reference: {
      type: String,
      trim: true,
      default: "",
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    toBank: {
      type: String,
      trim: true,
      default: "",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "AdminUser",
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "accounting-cash-transactions",
  }
);

accountingCashTransactionSchema.index({ accountName: 1, txDate: -1 });

export const AccountingCashTransaction = model<IAccountingCashTransaction>(
  "AccountingCashTransaction",
  accountingCashTransactionSchema
);
