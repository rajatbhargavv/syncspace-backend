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
  userId: string;
  status: AssigneeStatus;
}

export interface ITask {
  _id: string;

  spaceId: string;
  createdBy: string;

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

export interface ICreateTask {
  spaceId: string;
  createdBy: string;
  title: string;
  description?: string;
  priority?: TaskPriority;
  deadline: Date;
}

export interface IUpdateTask {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  deadline?: Date;
  progressStatus?: TaskProgressStatus;
}
