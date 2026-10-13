import { IComments, IUpdateComments } from "../types/comments.types.js";
import AppError from "../utils/AppError.js";
import Comment from "../models/Comment.model.js";
import Task from "../models/Task.model.js";

const add_comment = async (data: IComments) => {
    if(!data.userId || !data.taskId) {
        throw new AppError("UserId and TaskId is required, not found",404);
    }
    const new_comment = new Comment({
        taskId: data.taskId,
        userId: data.userId,
        content: data.content
    })
    return await new_comment.save();
}

// getting tasks comments
const getComments = async (taskId: string) => {
    if(!taskId)
        throw new AppError("TaskID is required", 401);
    const comments = await Comment.find({taskId: taskId});
    if(!comments) 
        throw new AppError("Comments not found for the given task id", 404);
    return comments;
}

const editComment = async (data: IUpdateComments) => {
    if(!data._id) 
        throw new AppError("CommentId is not provided", 404);
    const comment = await Comment.findById(data._id);
    if(!comment)
        throw new AppError("Comment not found with the given commentID", 404);
    return await Comment.findOneAndUpdate(
        { taskId: data._id},
        { $set: data },
        { new: true, runValidators: true }
    );
}

const deleteComment = async (commentId: string) => {
    if(!commentId)
        throw new AppError("CommentId is not provided", 404);
    return await Comment.findOneAndDelete({_id: commentId});
}
