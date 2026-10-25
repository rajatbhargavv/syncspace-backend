import Subtask from "../models/SubTask.model.js";
import Task from "../models/Task.model.js";
import { Space } from "../models/Space.model.js";
import { SpaceMember } from "../models/SpaceMember.model.js";
import { ISubtask, ICreateSubtaskData, IUpdateSubtaskData } from "../types/subTask.types.js";
import AppError from "../utils/AppError.js";
import { createNotification } from "./notification.service.js";
import { logActivityEvent } from "./activityEvent.service.js";

// Helper to verify user is active member or owner of space containing task
const verifyTaskMembership = async (taskId: string, userId: string) => {
  const task = await Task.findById(taskId);
  if (!task || task.lifecycleStatus === "DELETED") {
    throw new AppError("Task not found or deleted", 404);
  }

  const space = await Space.findById(task.spaceId);
  if (!space || space.status === "Inactive") {
    throw new AppError("Space not found or inactive", 404);
  }

  const isOwner = space.ownerId.toString() === userId.toString();
  const isMember = await SpaceMember.findOne({
    spaceId: space._id,
    userId,
    status: "ACTIVE",
  });

  if (!isOwner && !isMember) {
    throw new AppError("Access denied: You are not a member of this space", 403);
  }

  return { task, space };
};

export const createSubtask = async (
  data: ICreateSubtaskData,
  actorId?: string
): Promise<ISubtask> => {
  const { task, space } = await verifyTaskMembership(data.taskId, actorId || data.assigneeId);

  // Check if assignee is member/owner
  const isAssigneeOwner = space.ownerId.toString() === data.assigneeId.toString();
  const isAssigneeMember = await SpaceMember.findOne({
    spaceId: space._id,
    userId: data.assigneeId,
    status: "ACTIVE",
  });
  if (!isAssigneeOwner && !isAssigneeMember) {
    throw new AppError("Assignee must be an active member of this space", 400);
  }

  const newSubtask = new Subtask({
    taskId: data.taskId,
    title: data.title,
    description: data.description || "",
    assigneeId: data.assigneeId,
    priority: data.priority || "MEDIUM",
    deadline: data.deadline,
    status: "TODO",
    lifecycleStatus: "ACTIVE",
  });

  const savedSubtask = await newSubtask.save();

  if (actorId) {
    await logActivityEvent({
      spaceId: space._id,
      taskId: task._id,
      actorId,
      type: "SUBTASK_CREATED",
      meta: { subtaskId: savedSubtask._id, title: savedSubtask.title },
    });

    if (data.assigneeId.toString() !== actorId.toString()) {
      await createNotification([data.assigneeId], {
        message: `You were assigned a subtask "${savedSubtask.title}"`,
        type: "SUBTASK_CREATED",
        resource: "SUBTASK",
        resourceId: savedSubtask._id,
        senderId: actorId,
      });
    }
  }

  return savedSubtask;
};

export const getSubtaskById = async (
  subtaskId: string,
  userId?: string
): Promise<ISubtask> => {
  const subtask = await Subtask.findById(subtaskId);
  if (!subtask || subtask.lifecycleStatus === "DELETED") {
    throw new AppError("Subtask not found", 404);
  }

  if (userId) {
    await verifyTaskMembership(subtask.taskId, userId);
  }

  return subtask;
};

export const getSubtasksByTaskId = async (
  taskId: string,
  userId?: string
): Promise<ISubtask[]> => {
  if (userId) {
    await verifyTaskMembership(taskId, userId);
  } else {
    const task = await Task.findById(taskId);
    if (!task || task.lifecycleStatus === "DELETED") {
      throw new AppError("Task not found or deleted", 404);
    }
  }

  return await Subtask.find({
    taskId,
    lifecycleStatus: "ACTIVE",
  }).sort({ createdAt: 1 });
};

export const updateSubtask = async (
  subtaskId: string,
  updateData: IUpdateSubtaskData,
  userId: string
): Promise<ISubtask> => {
  const subtask = await Subtask.findById(subtaskId);
  if (!subtask || subtask.lifecycleStatus === "DELETED") {
    throw new AppError("Subtask not found", 404);
  }

  const { task, space } = await verifyTaskMembership(subtask.taskId, userId);

  if (updateData.assigneeId) {
    const isAssigneeOwner = space.ownerId.toString() === updateData.assigneeId.toString();
    const isAssigneeMember = await SpaceMember.findOne({
      spaceId: space._id,
      userId: updateData.assigneeId,
      status: "ACTIVE",
    });
    if (!isAssigneeOwner && !isAssigneeMember) {
      throw new AppError("Assignee must be an active member of this space", 400);
    }
    subtask.assigneeId = updateData.assigneeId;
  }

  if (updateData.title !== undefined) subtask.title = updateData.title;
  if (updateData.description !== undefined) subtask.description = updateData.description;
  if (updateData.priority !== undefined) subtask.priority = updateData.priority;
  if (updateData.deadline !== undefined) subtask.deadline = updateData.deadline;

  const oldStatus = subtask.status;
  if (updateData.status !== undefined) {
    subtask.status = updateData.status;
  }

  const savedSubtask = await subtask.save();

  if (updateData.status && updateData.status !== oldStatus) {
    if (updateData.status === "DONE") {
      await logActivityEvent({
        spaceId: space._id,
        taskId: task._id,
        actorId: userId,
        type: "SUBTASK_COMPLETED",
        meta: { subtaskId: subtask._id, title: subtask.title },
      });

      const recipientIds = new Set<string>();
      if (task.createdBy.toString() !== userId.toString()) {
        recipientIds.add(task.createdBy.toString());
      }
      if (space.ownerId.toString() !== userId.toString()) {
        recipientIds.add(space.ownerId.toString());
      }
      if (recipientIds.size > 0) {
        await createNotification([...recipientIds], {
          message: `Subtask "${subtask.title}" was completed`,
          type: "ASSIGNEE_SUBTASK_COMPLETED",
          resource: "SUBTASK",
          resourceId: subtask._id,
          senderId: userId,
        });
      }
    }
  }

  return savedSubtask;
};

export const deleteSubtask = async (
  subtaskId: string,
  userId?: string
): Promise<ISubtask> => {
  const subtask = await Subtask.findById(subtaskId);
  if (!subtask) {
    throw new AppError("Subtask not found", 404);
  }

  if (userId) {
    await verifyTaskMembership(subtask.taskId, userId);
  }

  subtask.lifecycleStatus = "DELETED";
  return await subtask.save();
};
