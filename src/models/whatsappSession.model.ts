import { Schema, model, type Document, Types } from "mongoose";
import { type IClientFile } from "./commercialUser.model.js";

export interface IWhatsAppSession extends Document {
  senderPhone: string;
  isActive: boolean;
  clientId?: Types.ObjectId | null;
  tempName?: string;
  pendingFiles: IClientFile[];
  createdAt: Date;
  updatedAt: Date;
}

const whatsappSessionSchema = new Schema<IWhatsAppSession>(
  {
    senderPhone: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: false,
      index: true,
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: "CommercialUser",
      default: null,
    },
    tempName: {
      type: String,
      trim: true,
      default: "",
    },
    pendingFiles: {
      type: [
        {
          public_id: { type: String, required: true },
          url: { type: String, required: true },
          fileName: { type: String, required: true },
          fileType: { type: String, default: "application/octet-stream" },
          fileSize: { type: Number, default: 0 },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: "whatsapp_sessions",
  }
);

export const WhatsAppSession = model<IWhatsAppSession>(
  "WhatsAppSession",
  whatsappSessionSchema
);

export default WhatsAppSession;
