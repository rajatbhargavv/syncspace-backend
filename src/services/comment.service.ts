import { ICreateComment, IComment, IUpdateComment } from "../types/comment.types.js";
import AppError from "../utils/AppError.js";
import Comment from "../models/Comment.model.js";
import Task from "../models/Task.model.js";
import User from "../models/User.model.js";
import ActivityEvent from "../models/ActivityEvent.model.js";
import { Space } from "../models/Space.model.js";
import { SpaceMember } from "../models/SpaceMember.model.js";
import { createNotification } from "./notification.service.js";
import { logActivityEvent } from "./activityEvent.service.js";
import { getIo } from "../websocket/socket.server.js";

export const createComment = async (data: ICreateComment): Promise<IComment> => {
    if (!data.userId) {
        throw new AppError("UserId is required", 400);
    }
    if (!data.taskId) {
        throw new AppError("TaskId is required", 400);
    }
    if (!data.content || !data.content.trim()) {
        throw new AppError("Comment content cannot be empty", 400);
    }

    // 1. Comments must belong to an existing Task
    const task = await Task.findById(data.taskId);
    if (!task) {
        throw new AppError("Task not found", 404);
    }

    // 2. Deleted Tasks policy
    if (task.lifecycleStatus === "DELETED") {
        throw new AppError("Cannot add a comment to a deleted task", 400);
    }

    // 3. Parent Space must exist and be Active
    const space = await Space.findById(task.spaceId);
    if (!space || space.status === "Inactive") {
        throw new AppError("Cannot comment in an inactive space", 400);
    }

    // 4. Only active members of an active Space can add comments
    const isOwner = space.ownerId.toString() === data.userId.toString();
    if (!isOwner) {
        const activeMember = await SpaceMember.findOne({
            spaceId: space._id,
            userId: data.userId,
            status: "ACTIVE",
        });
        if (!activeMember) {
            throw new AppError("Access denied: You must be an active member of this space to comment", 403);
        }
    }

    const newComment = new Comment({
        taskId: data.taskId,
        userId: data.userId,
        content: data.content.trim(),
    });

    const savedComment = await newComment.save();

    // Log ActivityEvent
    await logActivityEvent({
        spaceId: space._id,
        taskId: task._id,
        actorId: data.userId,
        type: "COMMENT_ADDED",
        meta: { commentId: savedComment._id },
    });

    // Parse @mentions
    const mentionedUserIds = new Set<string>();
    try {
        const spaceOwner = await User.findById(space.ownerId).select("_id name");
        const spaceMembers = await SpaceMember.find({ spaceId: space._id, status: "ACTIVE" }).populate("userId", "_id name");

        const candidates: { id: string; name: string }[] = [];
        if (spaceOwner) candidates.push({ id: spaceOwner._id.toString(), name: spaceOwner.name });
        for (const sm of spaceMembers) {
            if (sm.userId && (sm.userId as any).name) {
                candidates.push({ id: (sm.userId as any)._id.toString(), name: (sm.userId as any).name });
            }
        }

        // Check longest names first
        candidates.sort((a, b) => b.name.length - a.name.length);

        for (const candidate of candidates) {
            if (candidate.id === data.userId) continue;
            const mentionRegex = new RegExp(`@${candidate.name}\\b`, "i");
            if (mentionRegex.test(data.content)) {
                mentionedUserIds.add(candidate.id);
            }
        }

        if (mentionedUserIds.size > 0) {
            await createNotification([...mentionedUserIds], {
                message: `You were mentioned in a comment on task "${task.title}"`,
                type: "TASK_COMMENT",
                resource: "COMMENT",
                resourceId: savedComment._id,
                senderId: data.userId,
            });
        }

        // Also notify task creator if not the commenter and not already notified
        if (
            task.createdBy.toString() !== data.userId.toString() &&
            !mentionedUserIds.has(task.createdBy.toString())
        ) {
            await createNotification([task.createdBy.toString()], {
                message: `New comment on task "${task.title}"`,
                type: "TASK_COMMENT",
                resource: "COMMENT",
                resourceId: savedComment._id,
                senderId: data.userId,
            });
        }
    } catch (err) {
        console.error("Failed to parse mentions or notify:", err);
    }

    // Socket emit comment:created
    try {
        const io = getIo();
        io.to(`space:${space._id}`).emit("comment:created", savedComment);
    } catch {
        // Socket not initialized or error, ignore
    }

    return savedComment;
};

export const getComments = async (taskId: string, viewerUserId: string): Promise<IComment[]> => {
    if (!taskId) {
        throw new AppError("TaskId is required", 400);
    }
    if (!viewerUserId) {
        throw new AppError("UserId is required", 400);
    }

    // 1. Check parent task
    const task = await Task.findById(taskId);
    if (!task) {
        throw new AppError("Task not found", 404);
    }

    // 2. Parent Space status check
    const space = await Space.findById(task.spaceId);
    if (!space || space.status === "Inactive") {
        throw new AppError("Space not found or inactive", 404);
    }

    // 3. User must have permission to view the parent Task before reading its comments
    const isOwner = space.ownerId.toString() === viewerUserId.toString();
    if (!isOwner) {
        const activeMember = await SpaceMember.findOne({
            spaceId: space._id,
            userId: viewerUserId,
            status: "ACTIVE",
        });
        if (!activeMember) {
            throw new AppError("Access denied: You do not have permission to view comments for this task", 403);
        }
    }

    // Returns ALL comments on this task populated with author info, ordered chronologically
    return await Comment.find({ taskId })
        .populate("userId", "_id name")
        .sort({ createdAt: 1 });
};

export const getTaskTimeline = async (taskId: string, userId: string) => {
    if (!taskId) {
        throw new AppError("TaskId is required", 400);
    }

    const task = await Task.findById(taskId);
    if (!task) {
        throw new AppError("Task not found", 404);
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

    const comments = await Comment.find({ taskId })
        .populate("userId", "_id name")
        .lean();

    const events = await ActivityEvent.find({ taskId })
        .populate("actorId", "_id name")
        .lean();

    const merged = [
        ...comments.map((c: any) => ({
            kind: "comment" as const,
            ...c,
            author: c.userId,
        })),
        ...events.map((e: any) => ({
            kind: "event" as const,
            ...e,
            actor: e.actorId,
        })),
    ];

    merged.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    return merged;
};

export const updateComment = async (data: IUpdateComment): Promise<IComment | null> => {
    if (!data._id) {
        throw new AppError("CommentId is required", 400);
    }
    if (!data.content || !data.content.trim()) {
        throw new AppError("Comment content cannot be empty", 400);
    }

    const comment = await Comment.findById(data._id);
    if (!comment) {
        throw new AppError("Comment not found", 404);
    }

    // Check parent task and space archive policy
    const task = await Task.findById(comment.taskId);
    if (!task) {
        throw new AppError("Task not found", 404);
    }
    if (task.lifecycleStatus === "DELETED") {
        throw new AppError("Cannot edit comment on a deleted task", 400);
    }
    const space = await Space.findById(task.spaceId);
    if (!space || space.status === "Inactive") {
        throw new AppError("Cannot edit comment in an inactive space", 400);
    }

    return await Comment.findByIdAndUpdate(
        data._id,
        { $set: { content: data.content.trim(), edited: true } },
        { new: true, runValidators: true }
    );
};

export const deleteComment = async (commentId: string): Promise<IComment | null> => {
    if (!commentId) {
        throw new AppError("CommentId is required", 400);
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new AppError("Comment not found", 404);
    }

    // Check parent task and space archive policy
    const task = await Task.findById(comment.taskId);
    if (!task) {
        throw new AppError("Task not found", 404);
    }
    if (task.lifecycleStatus === "DELETED") {
        throw new AppError("Cannot delete comment on a deleted task", 400);
    }
    const space = await Space.findById(task.spaceId);
    if (!space || space.status === "Inactive") {
        throw new AppError("Cannot delete comment in an inactive space", 400);
    }

    return await Comment.findByIdAndDelete(commentId);
};
