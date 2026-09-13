import { randomUUID } from "crypto";
import { model,Schema } from "mongoose";

import { ISpaceMember } from "../types/spaceMember.types.js";

const spaceMemberSchema = new Schema<ISpaceMember>({
  spaceId: {
    type: Schema.Types.ObjectId,
    ref: "Space",
    required: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    enum: ["ACTIVE", "INACTIVE"],
    default: "ACTIVE",
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
});

export const SpaceMember = model<ISpaceMember>("SpaceMember", spaceMemberSchema);