import mongoose, { Schema } from "mongoose";
import { ISubtask } from "../types/subTask.types.js";

const subtaskSchema = new Schema<ISubtask>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    completed: {
      type: Boolean,
      default: false,
    },

    taskId: {
      type: Schema.Types.ObjectId,
      ref: "Task",
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
  },
  {
    timestamps: true,
  }
);

subtaskSchema.index({ taskId: 1 });
subtaskSchema.index({ assigneeId: 1 });

const Subtask = mongoose.model<ISubtask>("Subtask", subtaskSchema);

export default Subtask;