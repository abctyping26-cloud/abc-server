import { Schema, model, type Document } from "mongoose";

export interface IWhatsAppQuickReply extends Document {
  title: string;
  text: string;
  category?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const whatsappQuickReplySchema = new Schema<IWhatsAppQuickReply>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
      default: "general",
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: "whatsapp_quick_replies",
  }
);

export const WhatsAppQuickReply = model<IWhatsAppQuickReply>(
  "WhatsAppQuickReply",
  whatsappQuickReplySchema
);

export default WhatsAppQuickReply;
