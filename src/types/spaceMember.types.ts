import { Types } from "mongoose";

interface ISpaceMember {
  _id: Types.ObjectId;
  spaceId: String;
  userId:String;
  status: "ACTIVE" | "INACTIVE";
  joinedAt: Date;
}

export { ISpaceMember };