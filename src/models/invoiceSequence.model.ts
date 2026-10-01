import { Schema, model, type Document } from "mongoose";

export interface IInvoiceSequence extends Document {
  key: string;
  count: number;
  padding: number;
  lastInvoiceNo: string;
  createdAt: Date;
  updatedAt: Date;
}

const invoiceSequenceSchema = new Schema<IInvoiceSequence>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: "invoice_number",
      index: true,
    },
    count: {
      type: Number,
      default: 0,
    },
    padding: {
      type: Number,
      default: 4,
    },
    lastInvoiceNo: {
      type: String,
      default: "0000",
    },
  },
  {
    timestamps: true,
    collection: "invoice-sequences",
  }
);

export const InvoiceSequence = model<IInvoiceSequence>(
  "InvoiceSequence",
  invoiceSequenceSchema
);

export default InvoiceSequence;
