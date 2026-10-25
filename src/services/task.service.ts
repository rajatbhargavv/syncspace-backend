import Task from "../models/Task.model.js";
import { ITask, ICreateTask, IUpdateTask, AssigneeStatus } from "../types/task.types.js";
import AppError from "../utils/AppError.js";
import { Space } from "../models/Space.model.js";
import { SpaceMember } from "../models/SpaceMember.model.js";
import { createNotification } from "./notification.service.js";
import { logActivityEvent } from "./activityEvent.service.js";
import { getIo } from "../websocket/socket.server.js";

const emitTaskUpdated = (spaceId: string, task: any) => {
  try {
    const io = getIo();
    io.to(`space:${spaceId}`).emit("task:updated", task);
  } catch {
    // Socket not initialized or error, ignore
  }
};

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

  const savedTask = await newTask.save();

  // Log activity event
  await logActivityEvent({
    spaceId: savedTask.spaceId,
    taskId: savedTask._id,
    actorId: data.createdBy,
    type: "TASK_CREATED",
    meta: { title: savedTask.title },
  });

  // Notify space members & owner
  try {
    const members = await SpaceMember.find({ spaceId: space._id, status: "ACTIVE" });
    const recipientIds = new Set<string>();
    if (space.ownerId.toString() !== data.createdBy.toString()) {
      recipientIds.add(space.ownerId.toString());
    }
    members.forEach((m) => {
      if (m.userId.toString() !== data.createdBy.toString()) {
        recipientIds.add(m.userId.toString());
      }
    });

    if (recipientIds.size > 0) {
      await createNotification([...recipientIds], {
        message: `Task "${savedTask.title}" was created`,
        type: "TASK_CREATED",
        resource: "TASK",
        resourceId: savedTask._id,
        senderId: data.createdBy,
      });
    }
  } catch (err) {
    console.error("Failed to send task creation notifications:", err);
  }

  emitTaskUpdated(savedTask.spaceId, savedTask);

  return savedTask;
};

export const getSpaceTasks = async (
  spaceId: string,
  filters: { status?: string; assignee?: string; priority?: string }
): Promise<ITask[]> => {
  const query: any = {
    spaceId,
    lifecycleStatus: "ACTIVE",
  };

  if (filters.status) {
    query.progressStatus = filters.status;
  }
  if (filters.assignee) {
    query["assignees.userId"] = filters.assignee;
  }
  if (filters.priority) {
    query.priority = filters.priority;
  }

  return await Task.find(query).sort({ createdAt: -1 });
};

export const getTaskById = async (taskId: string, userId?: string): Promise<ITask> => {
  const task = await Task.findById(taskId);
  if (!task) {
    throw new AppError("Task not found", 404);
  }

  if (userId) {
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
  }

  return task;
};

export const updateTask = async (
  taskId: string,
  updateData: IUpdateTask,
  userId: string
): Promise<ITask> => {
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

  const oldStatus = task.progressStatus;

  if (updateData.title !== undefined) task.title = updateData.title;
  if (updateData.description !== undefined) task.description = updateData.description;
  if (updateData.priority !== undefined) task.priority = updateData.priority;
  if (updateData.deadline !== undefined) task.deadline = updateData.deadline;
  if (updateData.progressStatus !== undefined) task.progressStatus = updateData.progressStatus;

  const savedTask = await task.save();

  if (updateData.progressStatus && updateData.progressStatus !== oldStatus) {
    await logActivityEvent({
      spaceId: task.spaceId,
      taskId: task._id,
      actorId: userId,
      type: "TASK_STATUS_CHANGED",
      meta: { oldStatus, newStatus: task.progressStatus },
    });

    if (task.progressStatus === "COMPLETED") {
      const recipientIds = new Set<string>();
      if (task.createdBy.toString() !== userId.toString()) {
        recipientIds.add(task.createdBy.toString());
      }
      if (space.ownerId.toString() !== userId.toString()) {
        recipientIds.add(space.ownerId.toString());
      }
      if (recipientIds.size > 0) {
        await createNotification([...recipientIds], {
          message: `Task "${task.title}" was completed`,
          type: "ASSIGNEE_TASK_COMPLETED",
          resource: "TASK",
          resourceId: task._id,
          senderId: userId,
        });
      }
    }
  } else {
    await logActivityEvent({
      spaceId: task.spaceId,
      taskId: task._id,
      actorId: userId,
      type: "TASK_UPDATED",
      meta: updateData,
    });
  }

  emitTaskUpdated(task.spaceId, savedTask);

  return savedTask;
};

export const deleteTask = async (taskId: string, userId?: string): Promise<ITask> => {
  const task = await Task.findById(taskId);
  if (!task) {
    throw new AppError("Task not found", 404);
  }

  if (userId) {
    const space = await Space.findById(task.spaceId);
    if (!space || space.status === "Inactive") {
      throw new AppError("Space not found or inactive", 404);
    }
    const isOwner = space.ownerId.toString() === userId.toString();
    const isCreator = task.createdBy.toString() === userId.toString();
    if (!isOwner && !isCreator) {
      throw new AppError("Access denied: Only the task creator or space owner can delete this task", 403);
    }
  }

  task.lifecycleStatus = "DELETED";
  const savedTask = await task.save();

  emitTaskUpdated(task.spaceId, savedTask);

  return savedTask;
};

export const addAssignee = async (
  taskId: string,
  assigneeUserId: string,
  actorId: string
): Promise<ITask> => {
  const task = await Task.findById(taskId);
  if (!task || task.lifecycleStatus === "DELETED") {
    throw new AppError("Task not found or deleted", 404);
  }

  const space = await Space.findById(task.spaceId);
  if (!space || space.status === "Inactive") {
    throw new AppError("Space not found or inactive", 404);
  }

  // Check actor membership
  const isActorOwner = space.ownerId.toString() === actorId.toString();
  const isActorMember = await SpaceMember.findOne({
    spaceId: space._id,
    userId: actorId,
    status: "ACTIVE",
  });
  if (!isActorOwner && !isActorMember) {
    throw new AppError("Access denied: You are not a member of this space", 403);
  }

  // Check assignee membership
  const isAssigneeOwner = space.ownerId.toString() === assigneeUserId.toString();
  const isAssigneeMember = await SpaceMember.findOne({
    spaceId: space._id,
    userId: assigneeUserId,
    status: "ACTIVE",
  });
  if (!isAssigneeOwner && !isAssigneeMember) {
    throw new AppError("Assignee must be an active member of this space", 400);
  }

  const alreadyAssigned = task.assignees.some(
    (a) => a.userId.toString() === assigneeUserId.toString()
  );
  if (alreadyAssigned) {
    throw new AppError("User is already assigned to this task", 409);
  }

  task.assignees.push({
    userId: assigneeUserId,
    status: "TODO",
  });

  const savedTask = await task.save();

  await logActivityEvent({
    spaceId: task.spaceId,
    taskId: task._id,
    actorId,
    type: "ASSIGNEE_ADDED",
    meta: { assigneeId: assigneeUserId },
  });

  emitTaskUpdated(task.spaceId, savedTask);

  return savedTask;
};

export const removeAssignee = async (
  taskId: string,
  assigneeUserId: string,
  actorId: string
): Promise<ITask> => {
  const task = await Task.findById(taskId);
  if (!task || task.lifecycleStatus === "DELETED") {
    throw new AppError("Task not found or deleted", 404);
  }

  const space = await Space.findById(task.spaceId);
  if (!space || space.status === "Inactive") {
    throw new AppError("Space not found or inactive", 404);
  }

  const isActorOwner = space.ownerId.toString() === actorId.toString();
  const isActorMember = await SpaceMember.findOne({
    spaceId: space._id,
    userId: actorId,
    status: "ACTIVE",
  });
  if (!isActorOwner && !isActorMember) {
    throw new AppError("Access denied: You are not a member of this space", 403);
  }

  const assigneeIndex = task.assignees.findIndex(
    (a) => a.userId.toString() === assigneeUserId.toString()
  );
  if (assigneeIndex === -1) {
    throw new AppError("Assignee not found on this task", 404);
  }

  task.assignees.splice(assigneeIndex, 1);
  const savedTask = await task.save();

  await logActivityEvent({
    spaceId: task.spaceId,
    taskId: task._id,
    actorId,
    type: "ASSIGNEE_REMOVED",
    meta: { assigneeId: assigneeUserId },
  });

  emitTaskUpdated(task.spaceId, savedTask);

  return savedTask;
};

export const updateMyAssigneeStatus = async (
  taskId: string,
  userId: string,
  status: AssigneeStatus
): Promise<ITask> => {
  const task = await Task.findById(taskId);
  if (!task || task.lifecycleStatus === "DELETED") {
    throw new AppError("Task not found or deleted", 404);
  }

  const assignee = task.assignees.find(
    (a) => a.userId.toString() === userId.toString()
  );
  if (!assignee) {
    throw new AppError("You are not assigned to this task", 404);
  }

  const oldStatus = assignee.status;
  assignee.status = status;

  const savedTask = await task.save();

  await logActivityEvent({
    spaceId: task.spaceId,
    taskId: task._id,
    actorId: userId,
    type: "ASSIGNEE_STATUS_CHANGED",
    meta: { oldStatus, newStatus: status },
  });

  if (status === "DONE") {
    const space = await Space.findById(task.spaceId);
    const recipientIds = new Set<string>();
    if (task.createdBy.toString() !== userId.toString()) {
      recipientIds.add(task.createdBy.toString());
    }
    if (space && space.ownerId.toString() !== userId.toString()) {
      recipientIds.add(space.ownerId.toString());
    }
    if (recipientIds.size > 0) {
      await createNotification([...recipientIds], {
        message: `Task "${task.title}" was completed by assignee`,
        type: "ASSIGNEE_TASK_COMPLETED",
        resource: "TASK",
        resourceId: task._id,
        senderId: userId,
      });
    }
  }

  emitTaskUpdated(task.spaceId, savedTask);

  return savedTask;
};
