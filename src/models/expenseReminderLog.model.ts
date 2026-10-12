import { Schema, model, type Document, Types } from "mongoose";

export interface IExpenseReminderLog extends Document {
  reminderId?: Types.ObjectId;
  title: string;
  recipientEmail: string;
  category?: string;
  amount?: number;
  triggerStage: "week_before" | "3_days" | "2_days" | "day_of" | "test_email" | "manual";
  daysRemaining: number;
  status: "sent" | "failed";
  resendEmailId?: string;
  errorMessage?: string;
  sentAt: Date;
  triggeredBy: "cron" | "admin";
}

const expenseReminderLogSchema = new Schema<IExpenseReminderLog>(
  {
    reminderId: {
      type: Schema.Types.ObjectId,
      ref: "ExpenseReminder",
      default: null,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    recipientEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    category: {
      type: String,
      default: "General",
    },
    amount: {
      type: Number,
      default: 0,
    },
    triggerStage: {
      type: String,
      required: true,
      index: true,
    },
    daysRemaining: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["sent", "failed"],
      default: "sent",
      index: true,
    },
    resendEmailId: {
      type: String,
      default: "",
    },
    errorMessage: {
      type: String,
      default: "",
    },
    sentAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    triggeredBy: {
      type: String,
      enum: ["cron", "admin"],
      default: "cron",
    },
  },
  {
    timestamps: true,
    collection: "expense-reminder-logs",
  }
);

export const ExpenseReminderLog = model<IExpenseReminderLog>(
  "ExpenseReminderLog",
  expenseReminderLogSchema
);

export default ExpenseReminderLog;
