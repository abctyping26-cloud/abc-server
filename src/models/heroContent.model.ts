import { Schema, model, type Document, Types } from "mongoose";

export interface IHeroTimelineItem extends Document {
  title: string;
  hook: string;
  bgImageUrl: string;
  isActive: boolean;
  isDefault: boolean;
  startDate?: Date | null;
  endDate?: Date | null;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const heroTimelineSchema = new Schema<IHeroTimelineItem>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      default: "Standard Hero",
    },
    hook: {
      type: String,
      required: true,
      trim: true,
      default: "From Kerala to the Gulf —\nEvery Document, Every Step.",
    },
    bgImageUrl: {
      type: String,
      required: true,
      trim: true,
      default: "/hero.jpg",
    },
    isActive: {
      type: Boolean,
      default: false,
      index: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
      index: true,
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "AdminUser",
      required: false,
    },
  },
  {
    timestamps: true,
    collection: "hero-timelines",
  }
);

export const HeroTimelineItem = model<IHeroTimelineItem>(
  "HeroTimelineItem",
  heroTimelineSchema
);
