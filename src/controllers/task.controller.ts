import type { Request, Response, NextFunction } from "express";
import * as taskService from "../services/task.service.js";
import AppError from "../utils/AppError.js";

export const createTask = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            throw new AppError("Authentication required", 401);
        }

        const task = await taskService.createTask({
            ...req.body,
            createdBy: userId,
        });

        res.status(201).json({
            success: true,
            message: "Task created successfully",
            data: task,
        });
    } catch (error) {
        next(error);
    }
};

export const getTasks = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            throw new AppError("Authentication required", 401);
        }

        const tasks = await taskService.getTasks(userId, req.query);

        res.status(200).json({
            success: true,
            message: "Tasks fetched successfully",
            data: tasks,
        });
    } catch (error) {
        next(error);
    }
};

export const getTaskById = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            throw new AppError("Authentication required", 401);
        }

        const task = await taskService.getTaskById(
            userId,
            getParam(req.params.taskId, "Task ID")
        );

        res.status(200).json({
            success: true,
            message: "Task fetched successfully",
            data: task,
        });
    } catch (error) {
        next(error);
    }
};

export const updateTask = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            throw new AppError("Authentication required", 401);
        }

        const task = await taskService.updateTask(
            userId,
            getParam(req.params.taskId, "Task ID"),
            req.body
        );

        res.status(200).json({
            success: true,
            message: "Task updated successfully",
            data: task,
        });
    } catch (error) {
        next(error);
    }
};

export const deleteTask = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            throw new AppError("Authentication required", 401);
        }

        const task = await taskService.deleteTask(
            userId,
            getParam(req.params.taskId, "Task ID")
        );

        res.status(200).json({
            success: true,
            message: "Task deleted successfully",
            data: task,
        });
    } catch (error) {
        next(error);
    }
};

export const assignTask = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            throw new AppError("Authentication required", 401);
        }

        const task = await taskService.assignTask(
            userId,
            getParam(req.params.taskId, "Task ID"),
            req.body.assignees
        );

        res.status(200).json({
            success: true,
            message: "Task assignees updated successfully",
            data: task,
        });
    } catch (error) {
        next(error);
    }
};

export const updateAssigneeStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            throw new AppError("Authentication required", 401);
        }

        const task = await taskService.updateAssigneeStatus(
            userId,
            getParam(req.params.taskId, "Task ID"),
            getParam(req.params.userId, "Assignee ID"),
            req.body.status
        );

        res.status(200).json({
            success: true,
            message: "Assignee status updated successfully",
            data: task,
        });
    } catch (error) {
        next(error);
    }
};

export const completeTask = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            throw new AppError("Authentication required", 401);
        }

        const task = await taskService.completeTask(
            userId,
            getParam(req.params.taskId, "Task ID")
        );

        res.status(200).json({
            success: true,
            message: "Task completed successfully",
            data: task,
        });
    } catch (error) {
        next(error);
    }
};

function getParam(
    value: string | string[] | undefined,
    name: string
): string {
    if (typeof value !== "string" || value.length === 0) {
        throw new AppError(`${name} is required`, 400);
    }

    return value;
}