import mongoose, { Document, Schema, Types } from "mongoose";
import { ITask } from "../types/task.types.js";

const taskSchema = new Schema<ITask>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: ["TODO", "IN_PROGRESS", "DONE"],
      default: "TODO",
    },

    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH"],
      default: "MEDIUM",
    },

    spaceId: {
      type: Schema.Types.ObjectId,
      ref: "Space",
      required: true,
    },

    creatorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    assigneeId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    dueDate: {
      type: Date,
    },

    labels: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Useful for fetching tasks belonging to a Space
taskSchema.index({ spaceId: 1 });

// Useful for fetching a user's assigned tasks
taskSchema.index({ assigneeId: 1 });

const Task = mongoose.model<ITask>("Task", taskSchema);

export default Task;