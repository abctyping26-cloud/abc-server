import { Schema, model, type Document, Types } from "mongoose";

export interface IWorkSubTask {
  _id?: Types.ObjectId;
  projectName: string;
  workDone: string;
  completedAt?: Date;
}

export interface IWorkLog extends Document {
  adminId: Types.ObjectId;
  adminIdentifier: string;
  adminName: string;
  adminRole: "admin" | "superadmin" | "master_admin" | "worker_admin";
  date: string; // YYYY-MM-DD format
  tasks: IWorkSubTask[];
  createdAt: Date;
  updatedAt: Date;
}

const workSubTaskSchema = new Schema<IWorkSubTask>(
  {
    projectName: {
      type: String,
      required: true,
      trim: true,
      default: "General",
    },
    workDone: {
      type: String,
      required: true,
      trim: true,
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const workLogSchema = new Schema<IWorkLog>(
  {
    adminId: {
      type: Schema.Types.ObjectId,
      ref: "AdminUser",
      required: true,
      index: true,
    },
    adminIdentifier: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    adminName: {
      type: String,
      required: true,
      trim: true,
      default: "Admin",
    },
    adminRole: {
      type: String,
      enum: ["admin", "superadmin", "master_admin", "worker_admin"],
      default: "worker_admin",
    },
    date: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    tasks: {
      type: [workSubTaskSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: "work-logs",
  }
);

workLogSchema.index({ adminId: 1, date: 1 });

export const WorkLog = model<IWorkLog>("WorkLog", workLogSchema);

// Schema for work assigned by Master Admin to Worker Admins
export interface IAssignedWork extends Document {
  workerId: Types.ObjectId;
  workerIdentifier: string;
  workerName: string;
  masterId: Types.ObjectId;
  masterName: string;
  projectName: string;
  taskDescription: string;
  status: "pending" | "completed";
  assignedAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const assignedWorkSchema = new Schema<IAssignedWork>(
  {
    workerId: {
      type: Schema.Types.ObjectId,
      ref: "AdminUser",
      required: true,
      index: true,
    },
    workerIdentifier: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    workerName: {
      type: String,
      required: true,
      trim: true,
      default: "Worker Admin",
    },
    masterId: {
      type: Schema.Types.ObjectId,
      ref: "AdminUser",
      required: true,
    },
    masterName: {
      type: String,
      required: true,
      trim: true,
      default: "Master Admin",
    },
    projectName: {
      type: String,
      required: true,
      trim: true,
      default: "General",
    },
    taskDescription: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
      index: true,
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: "assigned-tasks",
  }
);

assignedWorkSchema.index({ workerId: 1, status: 1 });

export const AssignedWork = model<IAssignedWork>("AssignedWork", assignedWorkSchema);
