import mongoose, { Schema } from "mongoose";
import { randomUUID } from "crypto";
import { ISubtask } from "../types/subTask.types.js";

const subtaskSchema = new Schema<ISubtask>(
  {
    _id: {
      type: String,
      default: () => "Subtask_" + randomUUID(),
    },
    taskId: {
      type: String,
      ref: "Task",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    assigneeId: {
      type: String,
      ref: "User",
      required: true,
    },

    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
      default: "MEDIUM",
    },

    deadline: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["TODO", "IN_PROGRESS", "DONE"],
      default: "TODO",
    },

    lifecycleStatus: {  
      type: String,
      enum: ["ACTIVE", "DELETED"],
      default: "ACTIVE",
    },
  },
  {
    timestamps: true,
  }
);

subtaskSchema.index({ taskId: 1 });
subtaskSchema.index({ assigneeId: 1 });

const Subtask = mongoose.model<ISubtask>("Subtask", subtaskSchema);

export default Subtask;
