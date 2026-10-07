import { model,Schema } from "mongoose";

import { ISpaceMember } from "../types/spaceMember.types.js";

const spaceMemberSchema = new Schema<ISpaceMember>({
  spaceId: {
    type: String,
    ref: "Space",
    required: true,
  },
  userId: {
    type: String,
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
spaceMemberSchema.index({
  spaceId:1,userId:1
},{unique:true})
export const SpaceMember = model<ISpaceMember>("SpaceMember", spaceMemberSchema);