import { Schema, model, type Document, Types } from "mongoose";

export interface IMarqueeItem {
  _id?: Types.ObjectId;
  badgeText: string;
  message: string;
  ctaText: string;
  linkUrl: string;
}

export interface ITopMarqueeConfig extends Document {
  key: string;
  isActive: boolean;
  speedSeconds: number;
  items: IMarqueeItem[];
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const marqueeItemSchema = new Schema<IMarqueeItem>(
  {
    badgeText: {
      type: String,
      default: "NEW",
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    ctaText: {
      type: String,
      default: "Explore",
      trim: true,
    },
    linkUrl: {
      type: String,
      default: "/services/uae-pass-assistance",
      trim: true,
    },
  },
  { _id: true }
);

const topMarqueeConfigSchema = new Schema<ITopMarqueeConfig>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: "top_marquee",
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    speedSeconds: {
      type: Number,
      default: 32,
      min: 10,
      max: 120,
    },
    items: {
      type: [marqueeItemSchema],
      default: [],
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "AdminUser",
      required: false,
    },
  },
  {
    timestamps: true,
    collection: "website-contents",
  }
);

export const TopMarqueeConfig = model<ITopMarqueeConfig>(
  "TopMarqueeConfig",
  topMarqueeConfigSchema
);
