import type { Request, Response } from "express";
import * as taskService from "../services/task.service.js";
import AppError from "../utils/AppError.js";

export const createTask = async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const task = await taskService.createTask({
        ...req.body,
        createdBy: userId,
    });

    res.status(201).json({
        success: true,
        message: "Task created successfully",
        data: task,
    });
};

export const getTasks = async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const tasks = await taskService.getTasks(userId, req.query);

    res.status(200).json({
        success: true,
        message: "Tasks fetched successfully",
        data: tasks,
    });
};

export const getTaskById = async (req: Request, res: Response) => {
    const task = await taskService.getTaskById(
        getUserId(req),
        getParam(req.params.taskId, "Task ID")
    );

    res.status(200).json({
        success: true,
        message: "Task fetched successfully",
        data: task,
    });
};

export const updateTask = async (req: Request, res: Response) => {
    const task = await taskService.updateTask(
        getUserId(req),
        getParam(req.params.taskId, "Task ID"),
        req.body
    );

    res.status(200).json({
        success: true,
        message: "Task updated successfully",
        data: task,
    });
};

export const deleteTask = async (req: Request, res: Response) => {
    const task = await taskService.deleteTask(
        getUserId(req),
        getParam(req.params.taskId, "Task ID")
    );

    res.status(200).json({
        success: true,
        message: "Task deleted successfully",
        data: task,
    });
};

export const assignTask = async (req: Request, res: Response) => {
    const task = await taskService.assignTask(
        getUserId(req),
        getParam(req.params.taskId, "Task ID"),
        req.body.assignees
    );

    res.status(200).json({
        success: true,
        message: "Task assignees updated successfully",
        data: task,
    });
};

export const updateAssigneeStatus = async (req: Request, res: Response) => {
    const task = await taskService.updateAssigneeStatus(
        getUserId(req),
        getParam(req.params.taskId, "Task ID"),
        getParam(req.params.userId, "Assignee ID"),
        req.body.status
    );

    res.status(200).json({
        success: true,
        message: "Assignee status updated successfully",
        data: task,
    });
};

export const completeTask = async (req: Request, res: Response) => {
    const task = await taskService.completeTask(
        getUserId(req),
        getParam(req.params.taskId, "Task ID")
    );

    res.status(200).json({
        success: true,
        message: "Task completed successfully",
        data: task,
    });
};

function getUserId(req: Request): string {
    if (!req.user?.id) {
        throw new AppError("Authentication required", 401);
    }

    return req.user.id;
}

function getParam(
    value: string | string[] | undefined,
    name: string
): string {
    if (typeof value !== "string" || value.length === 0) {
        throw new AppError(`${name} is required`, 400);
    }

    return value;
}
