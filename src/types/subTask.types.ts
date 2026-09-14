import { Types } from "mongoose";

export interface ISubtask {
  title: string;
  completed: boolean;

  taskId: Types.ObjectId;
  creatorId: Types.ObjectId;
  assigneeId?: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}