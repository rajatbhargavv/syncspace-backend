import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import {
  handleCreateComment,
  handleDeleteComment,
  handleGetComments,
  handleGetTaskTimeline,
  handleUpdateComment,
} from "../controllers/comment.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireCommentOwner } from "../middleware/comment.middleware.js";
import validate from "../middleware/validation.middleware.js";
import { createCommentSchema, updateCommentSchema } from "../validators/comment.validator.js";

const commentRouter = Router({ mergeParams: true });
commentRouter.use(requireAuth);

// POST /api/tasks/:taskId/comments - Add a comment
commentRouter.post(
  "/tasks/:taskId/comments",
  validate(createCommentSchema),
  asyncHandler(handleCreateComment)
);

// GET /api/tasks/:taskId/comments - List task comments
commentRouter.get(
  "/tasks/:taskId/comments",
  asyncHandler(handleGetComments)
);

// GET /api/tasks/:taskId/timeline - Task timeline
commentRouter.get(
  "/tasks/:taskId/timeline",
  asyncHandler(handleGetTaskTimeline)
);

// PATCH /api/comments/:commentId - Edit your comment
commentRouter.patch(
  "/comments/:commentId",
  requireCommentOwner,
  validate(updateCommentSchema),
  asyncHandler(handleUpdateComment)
);

// DELETE /api/comments/:commentId - Delete your comment
commentRouter.delete(
  "/comments/:commentId",
  requireCommentOwner,
  asyncHandler(handleDeleteComment)
);

// Also handle when mounted directly on /api/comments
commentRouter.patch(
  "/:commentId",
  requireCommentOwner,
  validate(updateCommentSchema),
  asyncHandler(handleUpdateComment)
);

commentRouter.delete(
  "/:commentId",
  requireCommentOwner,
  asyncHandler(handleDeleteComment)
);

export default commentRouter;

