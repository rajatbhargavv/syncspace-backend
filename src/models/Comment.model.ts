import { randomUUID } from "crypto";
import { IComments } from "../types/comments.types.js";
import { Schema, model } from "mongoose";

const commentsSchema = new Schema(
  {
    _id: {
      type: String,
      default: () => "Comment_" + randomUUID(),
    },
    taskId: {
      type: String,
      ref: "Task",
      required: true,
    },
    userId: {
      type: String,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    edited: {
      type: Boolean,
      default: false,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);
