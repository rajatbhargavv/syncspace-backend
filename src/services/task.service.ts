import Task from "../models/Task.model.js";
import { ITask, ICreateTask } from "../types/task.types.js";
import AppError from "../utils/AppError.js";
import { Space } from "../models/Space.model.js";

export const createTask = async (data: ICreateTask): Promise<ITask> => {
  const space = await Space.findById(data.spaceId);
  if (!space || space.status === "Inactive") {
    throw new AppError("Space not found or inactive", 404);
  }

  const newTask = new Task({
    spaceId: data.spaceId,
    createdBy: data.createdBy,
    title: data.title,
    description: data.description,
    priority: data.priority || "MEDIUM",
    deadline: data.deadline,
    progressStatus: "TODO",
    lifecycleStatus: "ACTIVE",
    assignees: [],
  });

  return await newTask.save();
};

export const getTaskById = async (taskId: string): Promise<ITask> => {
  const task = await Task.findById(taskId);
  if (!task) {
    throw new AppError("Task not found", 404);
  }
  return task;
};

export const deleteTask = async (taskId: string): Promise<ITask> => {
  const task = await Task.findById(taskId);
  if (!task) {
    throw new AppError("Task not found", 404);
  }
  task.lifecycleStatus = "DELETED";
  return await task.save();
};

