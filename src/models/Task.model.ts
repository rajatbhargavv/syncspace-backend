import mongoose, { Document, Schema, Types } from "mongoose";
import { ITask } from "../types/task.types.js";

const taskSchema = new Schema<ITask>(
  {
    spaceId: {
      type: Schema.Types.ObjectId,
      ref: "Space",
      required: true,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
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

    progressStatus: {
      type: String,
      enum: ["TODO", "IN_PROGRESS", "COMPLETED"],
      default: "TODO",
    },

    lifecycleStatus: {
      type: String,
      enum: ["ACTIVE", "DELETED"],
      default: "ACTIVE",
    },

    assignees: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },

        status: {
          type: String,
          enum: ["TODO", "IN_PROGRESS", "DONE"],
          default: "TODO",
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Useful for fetching tasks belonging to a Space
taskSchema.index({ spaceId: 1 });
taskSchema.index({ createdBy: 1 });
taskSchema.index({ "assignees.userId": 1 });

// Useful for fetching a user's assigned tasks

const Task = mongoose.model<ITask>("Task", taskSchema);

export default Task;