import { Schema, model } from "mongoose";
import { randomUUID } from "crypto";
import { IPushSubscription } from "../types/push.types.js";

const pushSubscriptionSchema = new Schema<IPushSubscription>(
  {
    _id: {
      type: String,
      default: () => "PushSub_" + randomUUID(),
    },
    userId: {
      type: String,
      ref: "User",
      required: true,
    },
    endpoint: {
      type: String,
      required: true,
      trim: true,
    },
    keys: {
      p256dh: {
        type: String,
        required: true,
        trim: true,
      },
      auth: {
        type: String,
        required: true,
        trim: true,
      },
    },
    userAgent: {
      type: String,
      trim: true,
    },
    lastSuccessAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

pushSubscriptionSchema.index({ userId: 1 });
pushSubscriptionSchema.index({ endpoint: 1 }, { unique: true });

export const PushSubscription = model<IPushSubscription>(
  "PushSubscription",
  pushSubscriptionSchema
);
