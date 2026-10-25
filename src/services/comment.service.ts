import { ICreateComment, IComment, IUpdateComment } from "../types/comment.types.js";
import AppError from "../utils/AppError.js";
import Comment from "../models/Comment.model.js";
import Task from "../models/Task.model.js";
import { Space } from "../models/Space.model.js";
import { SpaceMember } from "../models/SpaceMember.model.js";

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

    return await newComment.save();
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
    // (viewerUserId is used ONLY to verify the viewer is an owner or active member of the space)
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

    // Returns ALL comments on this task from ALL users, ordered chronologically
    return await Comment.find({ taskId }).sort({ createdAt: 1 });
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
