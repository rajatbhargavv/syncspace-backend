export type SubTaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type SubTaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
export type SubTaskLifecycleStatus = "ACTIVE" | "DELETED";

export interface ISubtask {
  _id: string;
  taskId: string;

  title: string;
  description?: string;

  assigneeId: string;

  priority: SubTaskPriority;
  deadline: Date;

  status: SubTaskStatus;
  lifecycleStatus: SubTaskLifecycleStatus;

  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateSubtaskData {
  taskId: string;
  title: string;
  description?: string;
  assigneeId: string;
  priority?: SubTaskPriority;
  deadline: Date;
}

export interface IUpdateSubtaskData {
  title?: string;
  description?: string;
  assigneeId?: string;
  priority?: SubTaskPriority;
  deadline?: Date;
  status?: SubTaskStatus;
}

export interface ICreateSubtaskData {
  taskId: string;
  title: string;
  description?: string;
  assigneeId: string;
  priority?: SubTaskPriority;
  deadline: Date;
}

export interface IUpdateSubtaskData {
  title?: string;
  description?: string;
  assigneeId?: string;
  priority?: SubTaskPriority;
  deadline?: Date;
  status?: SubTaskStatus;
}
