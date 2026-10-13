import { Schema, model, type Document, Types } from "mongoose";

export interface IExpenseReminderSent {
  weekBefore: boolean;
  threeDaysBefore: boolean;
  twoDaysBefore: boolean;
  dayOf: boolean;
}

export interface IExpenseReminder extends Document {
  title: string;
  category: string;
  amount: number;
  currency: string;
  expiryDate: Date;
  targetEmail: string;
  targetPhone?: string;
  notes?: string;
  recurrence: "one_time" | "monthly" | "quarterly" | "yearly";
  status: "active" | "renewed" | "cancelled";
  remindersSent: IExpenseReminderSent;
  lastNotifiedAt?: Date;
  plannedTestNextCycle?: boolean;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const expenseReminderSchema = new Schema<IExpenseReminder>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      default: "General",
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      trim: true,
      default: "AED",
    },
    expiryDate: {
      type: Date,
      required: true,
      index: true,
    },
    targetEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    targetPhone: {
      type: String,
      trim: true,
      default: "",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    recurrence: {
      type: String,
      enum: ["one_time", "monthly", "quarterly", "yearly"],
      default: "monthly",
    },
    status: {
      type: String,
      enum: ["active", "renewed", "cancelled"],
      default: "active",
      index: true,
    },
    remindersSent: {
      weekBefore: { type: Boolean, default: false },
      threeDaysBefore: { type: Boolean, default: false },
      twoDaysBefore: { type: Boolean, default: false },
      dayOf: { type: Boolean, default: false },
    },
    lastNotifiedAt: {
      type: Date,
      default: null,
    },
    plannedTestNextCycle: {
      type: Boolean,
      default: false,
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
    collection: "expense-reminders",
  }
);

export const ExpenseReminder = model<IExpenseReminder>(
  "ExpenseReminder",
  expenseReminderSchema
);

export default ExpenseReminder;
