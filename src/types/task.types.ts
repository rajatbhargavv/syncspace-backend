import { Types } from "mongoose";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type TaskProgressStatus =
  | "TODO"
  | "IN_PROGRESS"
  | "COMPLETED";

export type TaskLifecycleStatus = "ACTIVE" | "DELETED";

export type AssigneeStatus =
  | "TODO"
  | "IN_PROGRESS"
  | "DONE";

export interface ITaskAssignee {
  userId: Types.ObjectId;
  status: AssigneeStatus;
}

export interface ITask {
  _id: Types.ObjectId;

  spaceId: Types.ObjectId;
  createdBy: Types.ObjectId;

  title: string;
  description?: string;

  priority: TaskPriority;
  deadline: Date;

  progressStatus: TaskProgressStatus;
  lifecycleStatus: TaskLifecycleStatus;

  assignees: ITaskAssignee[];

  createdAt: Date;
  updatedAt: Date;
}