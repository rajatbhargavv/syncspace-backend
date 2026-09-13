import { Types } from "mongoose";

interface ISpaceMember {
  _id: Types.ObjectId;
  spaceId: Types.ObjectId;
  userId: Types.ObjectId;
  status: "ACTIVE" | "INACTIVE";
  joinedAt: Date;
}

export { ISpaceMember };