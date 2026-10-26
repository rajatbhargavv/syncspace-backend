
import { Space } from "../models/Space.model.js";
import { SpaceMember } from "../models/SpaceMember.model.js";

import Task from "../models/Task.model.js";
import type {
    AssigneeStatus,
    ICreateTask,
    ITaskAssigneeInput,
    ITaskFilters,
    IUpdateTask,
    TaskSortField,
} from "../types/task.types.js";
import {
    getSpaceById,
} from "./space.service.js";
import { getSpaceMembers as getMembers } from "./spaceMember.service.js";

import AppError from "../utils/AppError.js";

// --------------------------------------------------
// Helpers
// --------------------------------------------------

const validateObjectId = (id: string, field: string) => {
    if (!id || typeof id !== "string") {
        throw new AppError(`Invalid ${field}`, 400);
    }
};

const getActiveTask = async (taskId: string) => {
    validateObjectId(taskId, "Task ID");

    const task = await Task.findOne({
        _id: taskId,
        lifecycleStatus: "ACTIVE",
    });

    if (!task) {
        throw new AppError("Active Task not found", 404);
    }

    return task;
};

const checkTaskOwner = (
    task: { createdBy: string },
    userId: string
) => {
    if (task.createdBy.toString() !== userId) {
        throw new AppError(
            "Only the Task Owner can perform this operation",
            403
        );
    }
};

// Uses existing services to verify that a user can access a Space.
const checkSpaceAccess = async (
    spaceId: string,
    userId: string
) => {
    const ownedSpace = await getSpaceById(userId, spaceId);

    if (ownedSpace) {
        return ownedSpace;
    }

    const members = await getMembers(spaceId);

    const isMember = members.some(
        (member) => member.userId.toString() === userId
    );

    if (!isMember) {
        throw new AppError(
            "You are not an active member of this Space",
            403
        );
    }

    return true;
};

const validateAssignees = async (
    spaceId: string,
    assigneeIds: string[]
) => {
    if (assigneeIds.length === 0) {
        throw new AppError(
            "A Task must have at least one active assignee",
            400
        );
    }

    if (new Set(assigneeIds).size !== assigneeIds.length) {
        throw new AppError(
            "Duplicate assignees are not allowed",
            400
        );
    }

    for (const id of assigneeIds) {
        validateObjectId(id, "Assignee ID");
    }

    const members = await getMembers(spaceId);

    const space = await Space.findById(spaceId);
    if (!space || space.status !== "Active") {
        throw new AppError("Space not found", 404);
    }

    const activeMemberIds = new Set(
        members.map((member) => member.userId.toString())
    );

    // The Space owner may not have a SpaceMember record.
    // Check ownership using the Space service when possible.
    activeMemberIds.add(space.ownerId.toString());

    const invalidAssignee = assigneeIds.find(
        (id) => !activeMemberIds.has(id)
    );

    if (invalidAssignee) {
        throw new AppError(
            "Every assignee must be an active member of the Space",
            400
        );
    }
};

// --------------------------------------------------
// 1. Create Task
// --------------------------------------------------

export const createTask = async (data: ICreateTask) => {
    validateObjectId(data.createdBy, "Creator ID");
    validateObjectId(data.spaceId, "Space ID");

    await checkSpaceAccess(data.spaceId, data.createdBy);

    await validateAssignees(
        data.spaceId,
        data.assignees.map((assignee) => assignee.userId)
    );

    const deadline = new Date(data.deadline);

    if (Number.isNaN(deadline.getTime())) {
        throw new AppError("Invalid Task deadline", 400);
    }

    const task = await Task.create({
        spaceId: data.spaceId,
        createdBy: data.createdBy,
        title: data.title,
        description: data.description ?? "",
        priority: data.priority ?? "MEDIUM",
        deadline,
        progressStatus: "TODO",
        lifecycleStatus: "ACTIVE",
        assignees: data.assignees.map((assignee) => ({
            userId: assignee.userId,
            status: "TODO",
        })),
    });

    return task;
};

// --------------------------------------------------
// 2. Get Tasks
// --------------------------------------------------

export const getTasks = async (
    userId: string,
    filters: ITaskFilters
) => {
    validateObjectId(userId, "User ID");

    const memberships = await getMembersForUser(userId);

    const accessibleSpaceIds = memberships;

    if (filters.spaceId) {
        validateObjectId(filters.spaceId, "Space ID");

        await checkSpaceAccess(filters.spaceId, userId);
    }

    const filter: Record<string, unknown> = {
        lifecycleStatus: filters.lifecycleStatus ?? "ACTIVE",
    };

    if (filters.spaceId) {
        filter.spaceId = filters.spaceId;
    } else {
        filter.spaceId = { $in: accessibleSpaceIds };
    }

    if (filters.priority) {
        filter.priority = filters.priority;
    }

    if (filters.progressStatus) {
        filter.progressStatus = filters.progressStatus;
    }

    if (filters.assignedTo) {
        validateObjectId(filters.assignedTo, "Assignee ID");
        filter["assignees.userId"] = filters.assignedTo;
    }

    if (filters.createdBy) {
        validateObjectId(filters.createdBy, "Creator ID");
        filter.createdBy = filters.createdBy;
    }
    if (filters.search) {
        const escaped = filters.search.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
        );

        filter.title = {
            $regex: escaped,
            $options: "i",
        };
    }

    const page = Math.max(1, Number(filters.page ?? 1));
    const limit = Math.min(
        100,
        Math.max(1, Number(filters.limit ?? 20))
    );

    const allowedSortFields: TaskSortField[] = [
        "createdAt",
        "updatedAt",
        "deadline",
        "priority",
    ];

    const sortBy = filters.sortBy &&
        allowedSortFields.includes(filters.sortBy)
        ? filters.sortBy
        : "createdAt";

    const sortOrder = filters.sortOrder === "asc" ? 1 : -1;

    const [tasks, total] = await Promise.all([
        Task.find(filter)
            .sort({ [sortBy]: sortOrder })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate("createdBy", "name email")
            .populate("assignees.userId", "name email"),

        Task.countDocuments(filter),
    ]);

    return {
        tasks,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
};

// Helper for listing the user's Spaces through memberships.
// Owner-only Spaces are also included.
const getMembersForUser = async (
    userId: string
): Promise<string[]> => {
    const [ownedSpaces, memberships] = await Promise.all([
        Space.find({ ownerId: userId, status: "Active" }).select("_id"),
        SpaceMember.find({ userId, status: "ACTIVE" }).select("spaceId"),
    ]);

    return [
        ...new Set([
            ...ownedSpaces.map((space) => space._id.toString()),
            ...memberships.map((membership) => membership.spaceId.toString()),
        ]),
    ];
};

// --------------------------------------------------
// 3. Get Task by ID
// --------------------------------------------------

export const getTaskById = async (
    userId: string,
    taskId: string
) => {
    validateObjectId(userId, "User ID");
    validateObjectId(taskId, "Task ID");

    const task = await Task.findById(taskId)
        .populate("createdBy", "name email")
        .populate("assignees.userId", "name email");

    if (!task) {
        throw new AppError("Task not found", 404);
    }

    await checkSpaceAccess(task.spaceId.toString(), userId);

    return task;
};

// --------------------------------------------------
// 4. Update Task
// --------------------------------------------------

export const updateTask = async (
    userId: string,
    taskId: string,
    data: IUpdateTask
) => {
    const task = await getActiveTask(taskId);

    checkTaskOwner(task, userId);

    await checkSpaceAccess(task.spaceId.toString(), userId);

    if (data.deadline !== undefined) {
        const deadline = new Date(data.deadline);

        if (Number.isNaN(deadline.getTime())) {
            throw new AppError("Invalid Task deadline", 400);
        }

        task.deadline = deadline;
    }

    if (data.title !== undefined) {
        task.title = data.title;
    }

    if (data.description !== undefined) {
        task.description = data.description;
    }

    if (data.priority !== undefined) {
        task.priority = data.priority;
    }

    await task.save();

    return task;
};

// --------------------------------------------------
// 5. Assign / Reassign Task Members
// --------------------------------------------------

export const assignTask = async (
    userId: string,
    taskId: string,
    assignees: ITaskAssigneeInput[]
) => {
    const task = await getActiveTask(taskId);

    checkTaskOwner(task, userId);

    await checkSpaceAccess(task.spaceId.toString(), userId);

    const ids = assignees.map((assignee) => assignee.userId);

    await validateAssignees(task.spaceId.toString(), ids);

    task.assignees = ids.map((id) => {
        const previous = task.assignees.find(
            (assignee) => assignee.userId.toString() === id
        );

        return {
            userId: id,
            status: previous?.status ?? "TODO",
        };
    }) as typeof task.assignees;

    await task.save();

    return task;
};

// --------------------------------------------------
// 6. Recalculate Assignment Progress
// --------------------------------------------------

export const updateAssigneeStatus = async (
    userId: string,
    taskId: string,
    assigneeId: string,
    status: AssigneeStatus
) => {
    if (userId !== assigneeId) {
        throw new AppError(
            "You can only update your own progress",
            403
        );
    }

    const task = await getActiveTask(taskId);

    await checkSpaceAccess(task.spaceId.toString(), userId);

    const assignee = task.assignees.find(
        (item) => item.userId.toString() === assigneeId
    );

    if (!assignee) {
        throw new AppError(
            "You are not assigned to this Task",
            403
        );
    }

    assignee.status = status;
    const statuses = task.assignees.map((item) => item.status);
    task.progressStatus = statuses.every((item) => item === "DONE")
        ? "COMPLETED"
        : statuses.some((item) => item === "IN_PROGRESS")
            ? "IN_PROGRESS"
            : "TODO";

    await task.save();
    return task;
};

// --------------------------------------------------
// 7. Manually Complete Task
// --------------------------------------------------

export const completeTask = async (
    userId: string,
    taskId: string
) => {
    const task = await getActiveTask(taskId);

    checkTaskOwner(task, userId);

    await checkSpaceAccess(task.spaceId.toString(), userId);

    task.progressStatus = "COMPLETED";

    task.assignees.forEach((assignee) => {
        assignee.status = "DONE";
    });

    await task.save();

    // Active SubTasks must also be marked DONE.
    // Delegate that operation to the SubTask service.

    return task;
};

// --------------------------------------------------
// 8. Soft-delete Task
// --------------------------------------------------

export const deleteTask = async (
    userId: string,
    taskId: string
) => {
    const task = await getActiveTask(taskId);

    checkTaskOwner(task, userId);

    await checkSpaceAccess(task.spaceId.toString(), userId);

    task.lifecycleStatus = "DELETED";

    await task.save();

    return task;
};
