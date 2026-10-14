import { Router } from "express";
import {
  handleAddComment,
  handleDeleteComment,
  handleEditComment,
  handleGetComments,
} from "../controllers/comment.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { requireCommentOwner } from "../middleware/comment.middleware.js";

const commentRouter = Router();
commentRouter.use(authMiddleware);

commentRouter.patch("/:commentId", requireCommentOwner, handleEditComment);

commentRouter.delete("/:commentID", requireCommentOwner, handleDeleteComment);