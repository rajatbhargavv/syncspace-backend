import { Types } from "mongoose";

interface ISpaceMember {
  _id: Types.ObjectId;
  spaceId: string;
  userId: string;
  status: "ACTIVE" | "INACTIVE" | "PENDING";
  joinedAt: Date;
}

export { ISpaceMember };
