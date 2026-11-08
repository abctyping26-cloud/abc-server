import { Schema, model, Types, type Document } from "mongoose";

export interface IPretheekshaInvoiceLineItem {
  slNo?: number;
  description: string;
  hsnCode?: string;
  qty: number;
  unitPrice: number;
  mrp?: number;
  costPrice?: number;
  gstRate?: number;
  gstAmount?: number;
  totalAmount: number;
}

export interface IPretheekshaInvoice extends Document {
  invoiceNo: string;
  invoiceDate: string;
  invoiceTime?: string;
  patient: {
    patientId?: Types.ObjectId;
    code?: string;
    name: string;
    mobile?: string;
    email?: string;
    address?: string;
  };
  customer?: {
    name: string;
    mobile?: string;
    code?: string;
    address?: string;
    email?: string;
  };
  lineItems: IPretheekshaInvoiceLineItem[];
  financialSummary: {
    subtotal?: string;
    vat?: string;
    grossAmount?: string;
    total?: string;
    paid?: string;
    balance?: string;
    publicTotal?: string;
    dbTotal?: string;
  };
  paymentDetails?: {
    payMethod?: string;
    payDescription?: string;
  };
  notes?: string;
  status: "paid" | "partial" | "unpaid" | "pending";
  createdAt: Date;
  updatedAt: Date;
}

const lineItemSchema = new Schema<IPretheekshaInvoiceLineItem>(
  {
    slNo: { type: Number },
    description: { type: String, required: true, trim: true },
    hsnCode: { type: String, trim: true, default: "" },
    qty: { type: Number, required: true, default: 1 },
    unitPrice: { type: Number, required: true, default: 0 },
    mrp: { type: Number, default: 0 },
    costPrice: { type: Number, default: 0 },
    gstRate: { type: Number, default: 0 },
    gstAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true, default: 0 },
  },
  { _id: false }
);

const pretheekshaInvoiceSchema = new Schema<IPretheekshaInvoice>(
  {
    invoiceNo: { type: String, required: true, unique: true, trim: true, index: true },
    invoiceDate: { type: String, required: true },
    invoiceTime: { type: String, default: "" },
    patient: {
      patientId: { type: Schema.Types.ObjectId, ref: "PretheekshaUser" },
      code: { type: String, trim: true, default: "" },
      name: { type: String, required: true, trim: true },
      mobile: { type: String, trim: true, default: "" },
      email: { type: String, trim: true, default: "" },
      address: { type: String, trim: true, default: "" },
    },
    customer: {
      name: { type: String, trim: true, default: "" },
      mobile: { type: String, trim: true, default: "" },
      code: { type: String, trim: true, default: "" },
      address: { type: String, trim: true, default: "" },
      email: { type: String, trim: true, default: "" },
    },
    lineItems: { type: [lineItemSchema], default: [] },
    financialSummary: {
      subtotal: { type: String, default: "0" },
      vat: { type: String, default: "0" },
      grossAmount: { type: String, default: "0" },
      total: { type: String, default: "0" },
      paid: { type: String, default: "0" },
      balance: { type: String, default: "0" },
      publicTotal: { type: String, default: "0" },
      dbTotal: { type: String, default: "0" },
    },
    paymentDetails: {
      payMethod: { type: String, default: "" },
      payDescription: { type: String, default: "" },
    },
    notes: { type: String, default: "" },
    status: {
      type: String,
      enum: ["paid", "partial", "unpaid", "pending"],
      default: "unpaid",
    },
  },
  { timestamps: true, collection: "invoices-preth" }
);

pretheekshaInvoiceSchema.index({
  "patient.name": "text",
  "patient.mobile": "text",
  "customer.name": "text",
  "customer.mobile": "text",
  invoiceNo: "text",
});

export const PretheekshaInvoice = model<IPretheekshaInvoice>(
  "PretheekshaInvoice",
  pretheekshaInvoiceSchema
);
export default PretheekshaInvoice;
