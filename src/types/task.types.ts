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

export type TaskSortField =
  | "createdAt"
  | "updatedAt"
  | "deadline"
  | "priority";

export type TaskSortOrder = "asc" | "desc";

export interface ITaskAssignee {
  userId: string;
  status: AssigneeStatus;
}

export interface ITaskAssigneeInput {
  userId: string;
}

export interface ICreateTask {
  spaceId: string;
  createdBy: string;
  title: string;
  description?: string;
  priority?: TaskPriority;
  deadline: Date | string;
  assignees: ITaskAssigneeInput[];
}

export interface IUpdateTask {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  deadline?: Date | string;
}

export interface ITaskFilters {
  spaceId?: string;
  priority?: TaskPriority;
  progressStatus?: TaskProgressStatus;
  lifecycleStatus?: TaskLifecycleStatus;
  assignedTo?: string;
  createdBy?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: TaskSortField;
  sortOrder?: TaskSortOrder;
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