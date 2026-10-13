import { Schema, model, type Document, Types } from "mongoose";

export interface IExpenseReminderRecipient extends Document {
  email: string;
  name?: string;
  isActive: boolean;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const expenseReminderRecipientSchema = new Schema<IExpenseReminderRecipient>(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      trim: true,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
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
    collection: "expense-reminder-recipients",
  }
);

export const ExpenseReminderRecipient = model<IExpenseReminderRecipient>(
  "ExpenseReminderRecipient",
  expenseReminderRecipientSchema
);

export default ExpenseReminderRecipient;
