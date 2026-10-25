import { NextFunction, Request, Response } from "express";
import Comment from "../models/Comment.model.js";
import AppError from "../utils/AppError.js";


export const requireCommentOwner = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new AppError("Unauthorized", 401);
        }
        const commentId = req.params.commentId || req.body.commentId;
        if (!commentId) {
            throw new AppError("Comment ID is required", 400);
        }
        const comment = await Comment.findById(commentId);
        if(!comment) {
            throw new AppError("Comment not found", 404);
        }
        if(comment.userId.toString() !== userId.toString()) {
            throw new AppError("User not authorized to access this comment", 403);
        }
        req.comment = comment;
        next();
    } catch (error) {
        next(error);
    }
}