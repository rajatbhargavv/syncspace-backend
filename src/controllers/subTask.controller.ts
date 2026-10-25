import { NextFunction, Request, Response } from "express";
import {
  createSubtask,
  deleteSubtask,
  getSubtaskById,
  getSubtasksByTaskId,
  updateSubtask,
} from "../services/subTask.service.js";
import { ICreateSubtaskData, IUpdateSubtaskData } from "../types/subTask.types.js";
import AppError from "../utils/AppError.js";

export async function handleCreateSubtask(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const taskId = (req.params.taskId || req.body.taskId) as string;
  const userId = req.user?.id;
  if (!taskId) {
    throw new AppError("Task ID is required", 400);
  }
  if (!userId) {
    throw new AppError("Unauthorized", 401);
  }

  const subtaskData: ICreateSubtaskData = {
    taskId,
    title: req.body.title,
    description: req.body.description,
    assigneeId: req.body.assigneeId,
    priority: req.body.priority,
    deadline: req.body.deadline,
  };

  const subtask = await createSubtask(subtaskData, userId);
  return res.status(201).json({
    message: "Subtask created successfully",
    subtask,
  });
}

export async function handleGetSubtaskById(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const subtaskId = (req.params.subtaskId || req.params.id) as string;
  const userId = req.user?.id;
  if (!subtaskId) {
    throw new AppError("Subtask ID is required", 400);
  }

  const subtask = await getSubtaskById(subtaskId, userId);
  return res.status(200).json({
    message: "Subtask fetched successfully",
    subtask,
  });
}

export async function handleGetSubtasksByTaskId(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const taskId = (req.params.taskId || req.query.taskId) as string;
  const userId = req.user?.id;
  if (!taskId) {
    throw new AppError("Task ID is required", 400);
  }

  const subtasks = await getSubtasksByTaskId(taskId, userId);
  return res.status(200).json({
    message: "Subtasks fetched successfully",
    subtasks,
  });
}

export async function handleUpdateSubtask(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const subtaskId = req.params.id as string;
  const userId = req.user?.id;
  if (!subtaskId) {
    throw new AppError("Subtask ID is required", 400);
  }
  if (!userId) {
    throw new AppError("Unauthorized", 401);
  }

  const updateData: IUpdateSubtaskData = {
    title: req.body.title,
    description: req.body.description,
    assigneeId: req.body.assigneeId,
    priority: req.body.priority,
    deadline: req.body.deadline,
    status: req.body.status,
  };

  const subtask = await updateSubtask(subtaskId, updateData, userId);
  return res.status(200).json({
    message: "Subtask updated successfully",
    subtask,
  });
}

export async function handleDeleteSubtask(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const subtaskId = (req.params.subtaskId ||
    req.params.id ||
    req.body.subtaskId) as string;
  const userId = req.user?.id;
  if (!subtaskId) {
    throw new AppError("Subtask ID is required", 400);
  }

  const subtask = await deleteSubtask(subtaskId, userId);
  return res.status(200).json({
    message: "Subtask deleted successfully",
    subtask,
  });
}
