import { Request , Response, NextFunction } from 'express';

import {
  addComment,
  deleteComment,
  editComment,
  getComments,
} from "../services/comments.service.js";
import AppError from '../utils/AppError.js';

import {IAddComments, IComments, IUpdateComments} from '../types/comments.types.js';
import constants from 'constants';

export async function handleAddComment(req: Request, res: Response, next: NextFunction){
    const userId = req.user?.id || req.body.userId;
    const taskId = req.params.taskId;
    if (typeof taskId !== "string") {
        throw new Error("Invalid taskId");
    }
    const content = req.body.content;
    const addData: IAddComments = {
        userId,
        taskId,
        content
    };
    const comment = await addComment(addData);
    return res.status(200).json({
        message: "Comment added successfully",
        comment
    });
}

export async function handleEditComment(req: Request, res: Response, next: NextFunction){
    const commentId = req.body.commentId;
    const content = req.body.content;
    const editData: IUpdateComments = {
        _id: commentId,
        content: content
    };
    const comment = await editComment(editData);
    return res.status(200).json({
        message: "Comment edited successfully",
        comment
    });
}

export async function handleGetComments(req: Request, res: Response, next: NextFunction){
    const taskId = req.params.taskId;
    if(typeof taskId !== "string")
        throw new Error("Invalid taskId");
    const comments = await getComments(taskId);
    return res.status(200).json({
        message: "comments fetched successfully",
        comments
    });
}