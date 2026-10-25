import { NextFunction, Request, Response } from "express";
import {
  createSubtask,
  deleteSubtask,
  getSubtaskById,
  getSubtasksByTaskId,
} from "../services/subTask.service.js";
import { ICreateSubtask } from "../services/subTask.service.js";
import AppError from "../utils/AppError.js";

export async function handleCreateSubtask(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const taskId = (req.params.taskId || req.body.taskId) as string;
  if (!taskId) {
    throw new AppError("Task ID is required", 400);
  }

  const subtaskData: ICreateSubtask = {
    taskId,
    title: req.body.title,
    description: req.body.description,
    assigneeId: req.body.assigneeId,
    priority: req.body.priority,
    deadline: req.body.deadline,
  };

  const subtask = await createSubtask(subtaskData);
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
  if (!subtaskId) {
    throw new AppError("Subtask ID is required", 400);
  }

  const subtask = await getSubtaskById(subtaskId);
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
  if (!taskId) {
    throw new AppError("Task ID is required", 400);
  }

  const subtasks = await getSubtasksByTaskId(taskId);
  return res.status(200).json({
    message: "Subtasks fetched successfully",
    subtasks,
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
  if (!subtaskId) {
    throw new AppError("Subtask ID is required", 400);
  }

  const subtask = await deleteSubtask(subtaskId);
  return res.status(200).json({
    message: "Subtask deleted successfully",
    subtask,
  });
}