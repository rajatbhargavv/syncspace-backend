export type NotificationType =
  | "TASK_COMMENT"
  | "TASK_CREATED"
  | "SPACE_MEMBER_JOINED"
  | "SPACE_MEMBER_LEFT"
  | "SUBTASK_CREATED"
  | "ASSIGNEE_TASK_COMPLETED"
  | "ASSIGNEE_SUBTASK_COMPLETED";
export type ResourceType = "SPACE" | "COMMENT" | "TASK" | "SUBTASK";
export interface INotification {
  _id: string;
  recipientId: string;
  senderId?: string;
  message: string;
  type: NotificationType;
  resource?: ResourceType;
  resourceId?: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}
