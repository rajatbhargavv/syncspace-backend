import { Document, Types } from "mongoose";
export interface ITask extends Document {
  title: string;
  description?: string;

  status: "TODO" | "IN_PROGRESS" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH";

  spaceId: Types.ObjectId;
  creatorId: Types.ObjectId;
  assigneeId?: Types.ObjectId;

  dueDate?: Date;

  labels: string[];

  createdAt: Date;
  updatedAt: Date;
}
