import { Schema, model, type Document, Types } from "mongoose";

export interface IAccountingExpense extends Document {
  expenseId: string;
  expenseDate: Date;
  supplierName?: string;
  supplierId?: Types.ObjectId;
  type: string;
  subType?: string;
  description: string;
  amount: number;
  payMode: "cash" | "bank";
  bank?: string;
  status: "Paid" | "Unpaid" | "Partial";
  division?: string;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const accountingExpenseSchema = new Schema<IAccountingExpense>(
  {
    expenseId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    expenseDate: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    supplierName: {
      type: String,
      trim: true,
      default: "",
    },
    supplierId: {
      type: Schema.Types.ObjectId,
      ref: "AccountingPersonnel",
      default: null,
    },
    type: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    subType: {
      type: String,
      trim: true,
      default: "",
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
    status: {
      type: String,
      enum: ["Paid", "Unpaid", "Partial"],
      default: "Paid",
      index: true,
    },
    division: {
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
    collection: "accounting-expenses",
  }
);

export const AccountingExpense = model<IAccountingExpense>(
  "AccountingExpense",
  accountingExpenseSchema
);
