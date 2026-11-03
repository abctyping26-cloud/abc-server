import { Schema, model, type Document } from "mongoose";

export interface IWhatsAppConfig extends Document {
  emailNotificationsEnabled: boolean;
  notificationEmails: string[];
  notificationMode: "all_messages" | "first_message_only";
  createdAt: Date;
  updatedAt: Date;
}

const DEFAULT_EMAILS = [
  "milanjiji0987654321@gmail.com",
  "abctyping20@gmail.com",
];

const whatsappConfigSchema = new Schema<IWhatsAppConfig>(
  {
    emailNotificationsEnabled: {
      type: Boolean,
      default: true,
    },
    notificationEmails: {
      type: [String],
      default: DEFAULT_EMAILS,
    },
    notificationMode: {
      type: String,
      enum: ["all_messages", "first_message_only"],
      default: "all_messages",
    },
  },
  {
    timestamps: true,
    collection: "whatsapp_config",
  }
);

export const WhatsAppConfig = model<IWhatsAppConfig>(
  "WhatsAppConfig",
  whatsappConfigSchema
);

/**
 * Returns the singleton WhatsApp configuration document from MongoDB,
 * or initializes it with the default settings if it doesn't exist yet.
 */
export const getOrCreateWhatsAppConfig = async (): Promise<IWhatsAppConfig> => {
  let doc = await WhatsAppConfig.findOne();
  if (!doc) {
    doc = await WhatsAppConfig.create({
      emailNotificationsEnabled: true,
      notificationEmails: DEFAULT_EMAILS,
      notificationMode: "all_messages",
    });
  } else if (!doc.notificationEmails || doc.notificationEmails.length === 0) {
    doc.notificationEmails = DEFAULT_EMAILS;
    await doc.save();
  }
  return doc;
};

export default WhatsAppConfig;
