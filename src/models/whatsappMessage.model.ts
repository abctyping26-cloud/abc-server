import { Schema, model, type Document } from "mongoose";

export type WhatsAppDirection = "incoming" | "outgoing";
export type WhatsAppMessageType =
  | "text"
  | "image"
  | "document"
  | "audio"
  | "video"
  | "sticker"
  | "location"
  | "other";
export type WhatsAppStatus =
  | "received"
  | "sent"
  | "delivered"
  | "read"
  | "failed";

export interface IWhatsAppMessage extends Document {
  messageId: string;
  customerPhone: string;
  customerName?: string;
  businessPhoneNumberId?: string;
  direction: WhatsAppDirection;
  type: WhatsAppMessageType;
  text?: string;
  mediaId?: string;
  mediaUrl?: string;
  mediaMimeType?: string;
  mediaFileName?: string;
  mediaFileSize?: number;
  status: WhatsAppStatus;
  rawPayload?: Record<string, unknown>;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const whatsappMessageSchema = new Schema<IWhatsAppMessage>(
  {
    messageId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    customerPhone: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    customerName: {
      type: String,
      trim: true,
    },
    businessPhoneNumberId: {
      type: String,
      trim: true,
    },
    direction: {
      type: String,
      enum: ["incoming", "outgoing"],
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "text",
        "image",
        "document",
        "audio",
        "video",
        "sticker",
        "location",
        "other",
      ],
      default: "text",
      index: true,
    },
    text: {
      type: String,
      trim: true,
      default: "",
    },
    mediaId: {
      type: String,
      trim: true,
    },
    mediaUrl: {
      type: String,
      trim: true,
    },
    mediaMimeType: {
      type: String,
      trim: true,
    },
    mediaFileName: {
      type: String,
      trim: true,
    },
    mediaFileSize: {
      type: Number,
    },
    status: {
      type: String,
      enum: ["received", "sent", "delivered", "read", "failed"],
      default: "received",
      index: true,
    },
    rawPayload: {
      type: Schema.Types.Mixed,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "whatsapp_messages",
  }
);

// Compound indexes for fast querying of chat threads
whatsappMessageSchema.index({ customerPhone: 1, timestamp: 1 });
whatsappMessageSchema.index({ direction: 1, status: 1 });

export const WhatsAppMessage = model<IWhatsAppMessage>(
  "WhatsAppMessage",
  whatsappMessageSchema
);

export default WhatsAppMessage;
