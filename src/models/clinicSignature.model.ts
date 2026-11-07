import { Schema, model, type Document } from "mongoose";

export interface IClinicSignature extends Document {
  name: string;
  title?: string;
  signatureData: string; // Base64 data URL (PNG, SVG, JPG)
  source: "drawn" | "uploaded";
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const clinicSignatureSchema = new Schema<IClinicSignature>(
  {
    name: { type: String, required: true, trim: true },
    title: { type: String, trim: true, default: "Consultant Fertility Specialist" },
    signatureData: { type: String, required: true },
    source: {
      type: String,
      enum: ["drawn", "uploaded"],
      default: "drawn",
    },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

clinicSignatureSchema.index({ name: 1, isDefault: -1 });

export const ClinicSignature = model<IClinicSignature>(
  "ClinicSignature",
  clinicSignatureSchema,
  "clinic-signatures"
);

export const DEFAULT_CLINIC_SIGNATURES = [
  {
    name: "Dr. Pretheeksha",
    title: "Chief Fertility Specialist & Gynecologist",
    signatureData:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 50" fill="none" stroke="%23181b20" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M 15 35 Q 30 35 40 35 L 50 35 L 55 12 L 62 44 L 70 20 L 78 40 L 84 28 L 92 36 L 104 35 Q 120 35 145 35" /></svg>',
    source: "drawn" as const,
    isDefault: true,
  },
];
