import { Schema, model, type Document } from "mongoose";

export interface INoteConnection {
  id: string;
  type: "client" | "invoice" | "file" | "number";
  title: string;
  value: string;
  subtitle?: string;
  metadata?: Record<string, any>;
}

export interface INote extends Document {
  title: string;
  content: string;
  color: "yellow" | "green" | "blue" | "peach" | "purple" | "rose" | "dark";
  x: number;
  y: number;
  zIndex: number;
  width: number;
  height: number;
  isPinned: boolean;
  project: "abc_typing" | "abc_neon";
  createdBy?: string;
  createdByName?: string;
  connections: INoteConnection[];
  createdAt: Date;
  updatedAt: Date;
}

const noteConnectionSchema = new Schema<INoteConnection>(
  {
    id: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["client", "invoice", "file", "number"],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    value: {
      type: String,
      required: true,
      trim: true,
    },
    subtitle: {
      type: String,
      trim: true,
      default: "",
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { _id: false }
);

const noteSchema = new Schema<INote>(
  {
    title: {
      type: String,
      trim: true,
      default: "",
    },
    content: {
      type: String,
      trim: true,
      default: "",
    },
    color: {
      type: String,
      enum: ["yellow", "green", "blue", "peach", "purple", "rose", "dark"],
      default: "yellow",
      index: true,
    },
    x: {
      type: Number,
      default: 100,
    },
    y: {
      type: Number,
      default: 100,
    },
    zIndex: {
      type: Number,
      default: 1,
    },
    width: {
      type: Number,
      default: 290,
    },
    height: {
      type: Number,
      default: 260,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    project: {
      type: String,
      enum: ["abc_typing", "abc_neon"],
      default: "abc_typing",
      index: true,
    },
    createdBy: {
      type: String,
      trim: true,
    },
    createdByName: {
      type: String,
      trim: true,
    },
    connections: {
      type: [noteConnectionSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: "notes",
  }
);

noteSchema.index({ project: 1, createdAt: -1 });

export const Note = model<INote>("Note", noteSchema);
export default Note;
