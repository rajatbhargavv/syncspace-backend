import { ICreateComment, IComment, IUpdateComment } from "../types/comments.types.js";
import AppError from "../utils/AppError.js";
import Comment from "../models/Comment.model.js";

const createComment = async (data: ICreateComment) => {
    if(!data.userId || !data.taskId) {
        throw new AppError("UserId and TaskId is required", 400);
    }
    const new_comment = new Comment({
        taskId: data.taskId,
        userId: data.userId,
        content: data.content
    });
    return await new_comment.save();
};

// getting tasks comments
const getComments = async (taskId: string) => {
    if(!taskId)
        throw new AppError("TaskID is required", 400);
    const comments = await Comment.find({ taskId });
    return comments;
};

const updateComment = async (data: IUpdateComment) => {
    if(!data._id) 
        throw new AppError("CommentId is not provided", 400);
    const comment = await Comment.findById(data._id);
    if(!comment)
        throw new AppError("Comment not found with the given commentID", 404);
    return await Comment.findOneAndUpdate(
        { _id: data._id },
        { $set: { content: data.content, edited: true } },
        { new: true, runValidators: true }
    );
};

const deleteComment = async (commentId: string) => {
    if(!commentId)
        throw new AppError("CommentId is not provided", 400);
    return await Comment.findOneAndDelete({ _id: commentId });
};

export { createComment, getComments, updateComment, deleteComment };