import { Schema, model } from "mongoose";
import { randomUUID } from "crypto";
import { ISpaceInvite } from "../types/invite.types.js";

const spaceInviteSchema = new Schema<ISpaceInvite>(
  {
    _id: {
      type: String,
      default: () => "Invite_" + randomUUID(),
    },
    token: {
      type: String,
      required: true,
      unique: true,
      default: () => randomUUID().replace(/-/g, ""),
    },
    spaceId: {
      type: String,
      ref: "Space",
      required: true,
    },
    inviterId: {
      type: String,
      ref: "User",
      required: true,
    },
    expiresAt: {
      type: Date,
      required: false,
    },
    maxUses: {
      type: Number,
      required: false,
    },
    uses: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "REVOKED"],
      default: "ACTIVE",
    },
  },
  {
    timestamps: true,
  }
);

spaceInviteSchema.index({ token: 1 });
spaceInviteSchema.index({ spaceId: 1 });

export const SpaceInvite = model<ISpaceInvite>("SpaceInvite", spaceInviteSchema);

