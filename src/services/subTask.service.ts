import Subtask from "../models/SubTask.model.js";
import Task from "../models/Task.model.js";
import { ISubtask, SubTaskPriority } from "../types/subTask.types.js";
import AppError from "../utils/AppError.js";

export interface ICreateSubtask {
  taskId: string;
  title: string;
  description?: string;
  assigneeId: string;
  priority?: SubTaskPriority;
  deadline: Date;
}

export const createSubtask = async (
  data: ICreateSubtask
): Promise<ISubtask> => {
  const task = await Task.findById(data.taskId);
  if (!task || task.lifecycleStatus === "DELETED") {
    throw new AppError("Task not found or deleted", 404);
  }

  const newSubtask = new Subtask({
    taskId: data.taskId,
    title: data.title,
    description: data.description,
    assigneeId: data.assigneeId,
    priority: data.priority || "MEDIUM",
    deadline: data.deadline,
    status: "TODO",
    lifecycleStatus: "ACTIVE",
  });

  return await newSubtask.save();
};

export const getSubtaskById = async (
  subtaskId: string
): Promise<ISubtask> => {
  const subtask = await Subtask.findById(subtaskId);
  if (!subtask) {
    throw new AppError("Subtask not found", 404);
  }
  return subtask;
};

export const getSubtasksByTaskId = async (
  taskId: string
): Promise<ISubtask[]> => {
  const task = await Task.findById(taskId);
  if (!task || task.lifecycleStatus === "DELETED") {
    throw new AppError("Task not found or deleted", 404);
  }

  return await Subtask.find({
    taskId,
    lifecycleStatus: "ACTIVE",
  }).sort({ createdAt: 1 });
};

export const deleteSubtask = async (
  subtaskId: string
): Promise<ISubtask> => {
  const subtask = await Subtask.findById(subtaskId);
  if (!subtask) {
    throw new AppError("Subtask not found", 404);
  }

  subtask.lifecycleStatus = "DELETED";
  return await subtask.save();
};
