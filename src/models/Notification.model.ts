import { Schema, model } from "mongoose";
import { randomUUID } from "crypto";
import { INotification } from "../types/notification.types.js";
const notificationSchema = new Schema<INotification>(
  {
    _id: {
      type: String,
      default: () => "Notification_" + randomUUID(),
    },
    recipientId: {
      type: String,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    senderId: {
      type: String,
      ref: "User",
    },
    type: {
      type: String,
      enum: [
        "TASK_COMMENT",
        "TASK_CREATED",
        "SPACE_MEMBER_JOINED",
        "SPACE_MEMBER_LEFT",
        "SUBTASK_CREATED",
        "ASSIGNEE_TASK_COMPLETED",
        "ASSIGNEE_SUBTASK_COMPLETED",
      ],
      required: true,
    },
    resource: {
      type: String,
      enum: ["SPACE", "COMMENT", "TASK", "SUBTASK"],
    },
    resourceId: {
      type: String,
    },
    isRead: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);
notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });
const Notification = model<INotification>("Notification", notificationSchema);
export default Notification;
