import { Schema, model, type Document, Types } from "mongoose";

export interface IAccountingBankTransaction extends Document {
  txType: "Deposit" | "Withdrawel" | "Bank To Bank";
  txDate: Date;
  bankName: string;
  toBank?: string;
  amount: number;
  paymentType: "Cash" | "Cheque";
  description?: string;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const accountingBankTransactionSchema = new Schema<IAccountingBankTransaction>(
  {
    txType: {
      type: String,
      enum: ["Deposit", "Withdrawel", "Bank To Bank"],
      required: true,
      index: true,
    },
    txDate: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    bankName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    toBank: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      default: 0,
    },
    paymentType: {
      type: String,
      enum: ["Cash", "Cheque"],
      default: "Cash",
    },
    description: {
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
    collection: "accounting-bank-transactions",
  }
);

export const AccountingBankTransaction = model<IAccountingBankTransaction>(
  "AccountingBankTransaction",
  accountingBankTransactionSchema
);
