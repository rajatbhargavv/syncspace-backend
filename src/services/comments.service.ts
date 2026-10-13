import { IComments } from "../types/comments.types.js";
import AppError from "../utils/AppError.js";
import Comment from "../models/Comment.model.js";

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