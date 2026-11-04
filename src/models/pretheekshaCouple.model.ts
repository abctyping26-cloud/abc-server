import { Schema, model, type Document, Types } from "mongoose";

export interface ICoupleMember {
  patient: Types.ObjectId;
  role:
    | "intended_mother"
    | "intended_father"
    | "intended_parent"
    | "partner"
    | "donor"
    | "surrogate";
  since: Date;
  until?: Date | null;
}

export interface IPretheekshaCouple extends Document {
  code: string;
  members: ICoupleMember[];
  status: "active" | "closed";
  notes?: string;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const coupleMemberSchema = new Schema<ICoupleMember>(
  {
    patient: {
      type: Schema.Types.ObjectId,
      ref: "PretheekshaUser",
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: [
        "intended_mother",
        "intended_father",
        "intended_parent",
        "partner",
        "donor",
        "surrogate",
      ],
      required: true,
    },
    since: {
      type: Date,
      default: Date.now,
    },
    until: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const pretheekshaCoupleSchema = new Schema<IPretheekshaCouple>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    members: {
      type: [coupleMemberSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ["active", "closed"],
      default: "active",
      index: true,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "AdminUser",
    },
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
    collection: "couple-preth",
  }
);

pretheekshaCoupleSchema.index({ "members.patient": 1 });

export const PretheekshaCouple = model<IPretheekshaCouple>(
  "PretheekshaCouple",
  pretheekshaCoupleSchema
);

export default PretheekshaCouple;
