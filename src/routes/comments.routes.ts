import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import {
  handleCreateComment,
  handleDeleteComment,
  handleGetComments,
  handleUpdateComment,
} from "../controllers/comment.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireCommentOwner } from "../middleware/comment.middleware.js";

const commentRouter = Router();
commentRouter.use(requireAuth);

// Add a comment to a task
commentRouter.post("/task/:taskId", asyncHandler(handleCreateComment));

// Get all comments for a task
commentRouter.get("/task/:taskId", asyncHandler(handleGetComments));

// Edit comment (owner only)
commentRouter.patch("/:commentId", requireCommentOwner, asyncHandler(handleUpdateComment));

// Delete comment (owner only)
commentRouter.delete("/:commentId", requireCommentOwner, asyncHandler(handleDeleteComment));

export default commentRouter;