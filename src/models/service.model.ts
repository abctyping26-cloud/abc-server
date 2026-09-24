import { Schema, model, type Document, Types } from "mongoose";

export interface IRequiredDocument {
  _id?: Types.ObjectId;
  title: string;
  description: string;
  mandatory: boolean;
}

export interface IFAQItem {
  _id?: Types.ObjectId;
  question: string;
  answer: string;
}

export interface IServiceCategory {
  id: string;
  name: string;
  shortName: string;
}

export interface IService extends Document {
  slug: string;
  serviceId: string;
  name: string;
  category: IServiceCategory;
  tagline: string;
  requiredDocuments: IRequiredDocument[];
  faqs: IFAQItem[];
  isCustomized: boolean;
  order: number;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const requiredDocumentSchema = new Schema<IRequiredDocument>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    mandatory: {
      type: Boolean,
      default: true,
    },
  },
  { _id: true }
);

const faqItemSchema = new Schema<IFAQItem>(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    answer: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: true }
);

const serviceSchema = new Schema<IService>(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    serviceId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      id: { type: String, required: true, index: true },
      name: { type: String, required: true },
      shortName: { type: String, required: true },
    },
    tagline: {
      type: String,
      default: "",
      trim: true,
    },
    requiredDocuments: {
      type: [requiredDocumentSchema],
      default: [],
    },
    faqs: {
      type: [faqItemSchema],
      default: [],
    },
    isCustomized: {
      type: Boolean,
      default: false,
      index: true,
    },
    order: {
      type: Number,
      default: 0,
      index: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "AdminUser",
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "services", // Explicit collection name
  }
);

export const Service = model<IService>("Service", serviceSchema);

export default Service;
