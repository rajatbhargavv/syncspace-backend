import { Request, Response, NextFunction } from "express";
import {
  createTask,
  getTaskById,
  deleteTask,
  getSpaceTasks,
  updateTask,
  addAssignee,
  removeAssignee,
  updateMyAssigneeStatus,
} from "../services/task.service.js";
import AppError from "../utils/AppError.js";

export async function handleCreateTask(req: Request, res: Response, next: NextFunction) {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError("Unauthorized", 401);
  }
  const task = await createTask({
    ...req.body,
    createdBy: userId,
  });
  return res.status(201).json({
    message: "Task created successfully",
    task,
  });
}

export async function handleGetSpaceTasks(req: Request, res: Response, next: NextFunction) {
  const spaceId = req.params.id as string;
  if (!spaceId) {
    throw new AppError("Space ID is required", 400);
  }
  const { status, assignee, priority } = req.query;
  const tasks = await getSpaceTasks(spaceId, {
    status: status as string | undefined,
    assignee: assignee as string | undefined,
    priority: priority as string | undefined,
  });
  return res.status(200).json({
    message: "Tasks fetched successfully",
    tasks,
  });
}

export async function handleGetTaskById(req: Request, res: Response, next: NextFunction) {
  const taskId = req.params.id as string;
  const userId = req.user?.id;
  if (!taskId) {
    throw new AppError("Task ID is required", 400);
  }
  const task = await getTaskById(taskId, userId);
  return res.status(200).json({
    message: "Task fetched successfully",
    task,
  });
}

export async function handleUpdateTask(req: Request, res: Response, next: NextFunction) {
  const taskId = req.params.id as string;
  const userId = req.user?.id;
  if (!taskId) {
    throw new AppError("Task ID is required", 400);
  }
  if (!userId) {
    throw new AppError("Unauthorized", 401);
  }
  const task = await updateTask(taskId, req.body, userId);
  return res.status(200).json({
    message: "Task updated successfully",
    task,
  });
}

export async function handleDeleteTask(req: Request, res: Response, next: NextFunction) {
  const taskId = req.params.id as string;
  const userId = req.user?.id;
  if (!taskId) {
    throw new AppError("Task ID is required", 400);
  }
  if (!userId) {
    throw new AppError("Unauthorized", 401);
  }
  const task = await deleteTask(taskId, userId);
  return res.status(200).json({
    message: "Task deleted successfully",
    task,
  });
}

export async function handleAddAssignee(req: Request, res: Response, next: NextFunction) {
  const taskId = req.params.id as string;
  const userId = req.user?.id;
  const { userId: assigneeUserId } = req.body;
  if (!taskId) {
    throw new AppError("Task ID is required", 400);
  }
  if (!userId) {
    throw new AppError("Unauthorized", 401);
  }
  if (!assigneeUserId) {
    throw new AppError("Assignee userId is required", 400);
  }
  const task = await addAssignee(taskId, assigneeUserId, userId);
  return res.status(200).json({
    message: "Assignee added successfully",
    task,
  });
}

export async function handleRemoveAssignee(req: Request, res: Response, next: NextFunction) {
  const taskId = req.params.id as string;
  const userId = req.user?.id;
  const assigneeUserId = req.params.userId as string;
  if (!taskId) {
    throw new AppError("Task ID is required", 400);
  }
  if (!userId) {
    throw new AppError("Unauthorized", 401);
  }
  if (!assigneeUserId) {
    throw new AppError("Assignee userId is required", 400);
  }
  const task = await removeAssignee(taskId, assigneeUserId, userId);
  return res.status(200).json({
    message: "Assignee removed successfully",
    task,
  });
}

export async function handleUpdateMyAssigneeStatus(req: Request, res: Response, next: NextFunction) {
  const taskId = req.params.id as string;
  const userId = req.user?.id;
  const { status } = req.body;
  if (!taskId) {
    throw new AppError("Task ID is required", 400);
  }
  if (!userId) {
    throw new AppError("Unauthorized", 401);
  }
  if (!status) {
    throw new AppError("Status is required", 400);
  }
  const task = await updateMyAssigneeStatus(taskId, userId, status);
  return res.status(200).json({
    message: "Assignee status updated successfully",
    task,
  });
}
