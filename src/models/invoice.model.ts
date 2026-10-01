import { Schema, model, type Document, Types } from "mongoose";

export interface IInvoiceLineItem {
  slNo: number;
  packageCode: string;
  description: string;
  qty: number;
  unitPrice: number;
  totalAmount: number;
  employee: string;
  costPrice: number;
}

export interface IInvoiceCustomer {
  name: string;
  mobile?: string;
  code?: string;
  address?: string;
  email?: string;
  company?: string;
  customerType?: string;
  clientId?: Types.ObjectId;
}

export interface IInvoicePaymentDetails {
  payDescription?: string;
  adjustAdvance?: boolean;
  payGovtFee?: string;
  payMethod?: string;
  payCash?: string;
  payCc?: string;
}

export interface IInvoiceFinancialSummary {
  total: string;
  discount?: string;
  discountPercent?: string;
  taxableAmount?: string;
  totalBeforeVat: string;
  vat: string;
  grossAmount: string;
  paid: string;
  balance: string;
}

export interface IAccountingInvoice extends Document {
  invoiceNo: string;
  invoiceDate: string;
  invoiceTime: string;
  lpoNo?: string;
  salesMan?: string;
  salesManId?: Types.ObjectId;
  referredBy?: string;
  division?: string;
  customer: IInvoiceCustomer;
  lineItems: IInvoiceLineItem[];
  paymentDetails: IInvoicePaymentDetails;
  financialSummary: IInvoiceFinancialSummary;
  bank?: string;
  bankC?: string;
  supplier?: string;
  supplierC?: string;
  govtFeePaidByCustomer?: boolean;
  govtFeeAmount?: string;
  status: "paid" | "partial" | "unpaid" | "draft";
  notes?: string;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const invoiceLineItemSchema = new Schema<IInvoiceLineItem>(
  {
    slNo: { type: Number, required: true },
    packageCode: { type: String, default: "" },
    description: { type: String, required: true, trim: true },
    qty: { type: Number, required: true, default: 1 },
    unitPrice: { type: Number, required: true, default: 0 },
    totalAmount: { type: Number, required: true, default: 0 },
    employee: { type: String, default: "", trim: true },
    costPrice: { type: Number, default: 0 },
  },
  { _id: false }
);

const accountingInvoiceSchema = new Schema<IAccountingInvoice>(
  {
    invoiceNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    invoiceDate: {
      type: String,
      required: true,
      index: true,
    },
    invoiceTime: {
      type: String,
      default: "",
    },
    lpoNo: {
      type: String,
      default: "",
      trim: true,
    },
    salesMan: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    salesManId: {
      type: Schema.Types.ObjectId,
      ref: "AccountingPersonnel",
      default: null,
    },
    referredBy: {
      type: String,
      default: "",
      trim: true,
    },
    division: {
      type: String,
      default: "",
      trim: true,
    },
    customer: {
      name: { type: String, required: true, trim: true, index: true },
      mobile: { type: String, default: "", trim: true, index: true },
      code: { type: String, default: "", trim: true, index: true },
      address: { type: String, default: "", trim: true },
      email: { type: String, default: "", trim: true },
      company: { type: String, default: "", trim: true },
      customerType: { type: String, default: "registered" },
      clientId: { type: Schema.Types.ObjectId, ref: "Client", default: null, index: true },
    },
    lineItems: [invoiceLineItemSchema],
    paymentDetails: {
      payDescription: { type: String, default: "" },
      adjustAdvance: { type: Boolean, default: false },
      payGovtFee: { type: String, default: "0" },
      payMethod: { type: String, default: "" },
      payCash: { type: String, default: "0" },
      payCc: { type: String, default: "0" },
    },
    financialSummary: {
      total: { type: String, default: "0.00" },
      discount: { type: String, default: "0" },
      discountPercent: { type: String, default: "0" },
      taxableAmount: { type: String, default: "0.00" },
      totalBeforeVat: { type: String, default: "0.00" },
      vat: { type: String, default: "0.00" },
      grossAmount: { type: String, default: "0.00" },
      paid: { type: String, default: "0.00" },
      balance: { type: String, default: "0.00" },
    },
    bank: {
      type: String,
      default: "",
      trim: true,
    },
    bankC: {
      type: String,
      default: "",
    },
    supplier: {
      type: String,
      default: "",
      trim: true,
    },
    supplierC: {
      type: String,
      default: "",
    },
    govtFeePaidByCustomer: {
      type: Boolean,
      default: false,
    },
    govtFeeAmount: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["paid", "partial", "unpaid", "draft"],
      default: "unpaid",
      index: true,
    },
    notes: {
      type: String,
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
    collection: "accounting-invoices",
  }
);

accountingInvoiceSchema.index({ "customer.name": 1, createdAt: -1 });
accountingInvoiceSchema.index({ "lineItems.employee": 1 });

export const AccountingInvoice = model<IAccountingInvoice>("AccountingInvoice", accountingInvoiceSchema);
