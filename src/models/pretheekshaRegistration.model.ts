import { Schema, model, type Document } from "mongoose";

export interface IPretheekshaRegistration extends Document {
  key: string;
  result: Record<string, any>;
  createdAt: Date;
}

const pretheekshaRegistrationSchema = new Schema<IPretheekshaRegistration>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    result: {
      type: Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "registration-preth",
  }
);

// TTL index to automatically purge idempotency records after 24 hours (86,400 seconds)
pretheekshaRegistrationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 86400 }
);

export const PretheekshaRegistration = model<IPretheekshaRegistration>(
  "PretheekshaRegistration",
  pretheekshaRegistrationSchema
);

export default PretheekshaRegistration;
