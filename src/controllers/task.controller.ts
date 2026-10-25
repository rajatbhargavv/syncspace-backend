import { Request, Response, NextFunction } from "express";
import { createTask, getTaskById, deleteTask } from "../services/task.service.js";
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

export async function handleGetTaskById(req: Request, res: Response, next: NextFunction) {
  const taskId = req.params.id as string;
  if (!taskId) {
    throw new AppError("Task ID is required", 400);
  }
  const task = await getTaskById(taskId);
  return res.status(200).json({
    message: "Task fetched successfully",
    task,
  });
}

export async function handleDeleteTask(req: Request, res: Response, next: NextFunction) {
  const taskId = req.params.id as string;
  if (!taskId) {
    throw new AppError("Task ID is required", 400);
  }
  const task = await deleteTask(taskId);
  return res.status(200).json({
    message: "Task deleted successfully",
    task,
  });
}

