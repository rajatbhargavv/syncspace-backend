import { Request , Response, NextFunction } from 'express';
import {
  createComment,
  deleteComment,
  getComments,
  updateComment,
} from "../services/comments.service.js";
import AppError from '../utils/AppError.js';
import { ICreateComment, IUpdateComment } from '../types/comments.types.js';

export async function handleCreateComment(req: Request, res: Response, next: NextFunction){
    const userId = req.user?.id || req.body.userId;
    const taskId = req.params.taskId as string;
    if (!taskId) {
        throw new AppError("TaskId is required", 400);
    }
    const content = req.body.content;
    if (!content) {
        throw new AppError("Content is required", 400);
    }
    const addData: ICreateComment = {
        userId,
        taskId,
        content
    };
    const comment = await createComment(addData);
    return res.status(201).json({
        message: "Comment added successfully",
        comment
    });
}

export async function handleUpdateComment(req: Request, res: Response, next: NextFunction){
    const commentId = (req.params.commentId || req.body.commentId) as string;
    if (!commentId) {
        throw new AppError("CommentId is required", 400);
    }
    const content = req.body.content;
    if (!content) {
        throw new AppError("Content is required", 400);
    }
    const editData: IUpdateComment = {
        _id: commentId,
        content: content
    };
    const comment = await updateComment(editData);
    return res.status(200).json({
        message: "Comment edited successfully",
        comment
    });
}

export async function handleGetComments(req: Request, res: Response, next: NextFunction){
    const taskId = req.params.taskId as string;
    if (!taskId) {
        throw new AppError("TaskId is required", 400);
    }
    const comments = await getComments(taskId);
    return res.status(200).json({
        message: "comments fetched successfully",
        comments
    });
}

export async function handleDeleteComment(req: Request, res: Response, next: NextFunction){
    const commentId = req.params.commentId as string;
    if(!commentId) {
        throw new AppError("CommentId is required", 400);
    }
    const comment = await deleteComment(commentId);
    return res.status(200).json({
        message: "Comment deleted successfully",
        comment
    });
}