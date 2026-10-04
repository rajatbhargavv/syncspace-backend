import { Types } from "mongoose";

export type SubTaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type SubTaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
export type SubTaskLifecycleStatus = "ACTIVE" | "DELETED";

interface ISubtask {
  taskId: Types.ObjectId;

  title: string;
  description?: string;

  assigneeId: Types.ObjectId;

  priority: SubTaskPriority;
  deadline: Date;

  status: SubTaskStatus;
  lifecycleStatus: SubTaskLifecycleStatus;

  createdAt: Date;
  updatedAt: Date;
}
export { ISubtask };