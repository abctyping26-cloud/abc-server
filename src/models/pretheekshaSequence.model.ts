import { Schema, model, type Document } from "mongoose";

export interface IPretheekshaSequence extends Document {
  key: string;
  count: number;
  padding: number;
  lastInvoiceNo: string;
}

const pretheekshaSequenceSchema = new Schema<IPretheekshaSequence>(
  {
    key: { type: String, required: true, unique: true, default: "clinic_invoice_seq" },
    count: { type: Number, default: 0 },
    padding: { type: Number, default: 4 },
    lastInvoiceNo: { type: String, default: "0000" },
  },
  { timestamps: true, collection: "sequence-preth" }
);

export const PretheekshaSequence = model<IPretheekshaSequence>(
  "PretheekshaSequence",
  pretheekshaSequenceSchema
);
export default PretheekshaSequence;
