import { NextFunction, Request, Response } from "express";
import Comment from "../models/Comment.model.js";
import AppError from "../utils/AppError.js";


export const requireCommentOwner = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        const commentId = req.params.commentId;
        const comment = await Comment.findById(commentId);
        if(!comment)
            throw new AppError("Comment not found", 404);
        if(comment.userId !== userId)
            throw new AppError("User not authorized to access this comment", 401);
        (req as any).comment = comment;
        next();
    } catch (error) {
        next(error);
    }
}