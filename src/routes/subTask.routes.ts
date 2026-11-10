import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import {
  handleCreateSubtask,
  handleGetSubtasksByTaskId,
  handleUpdateSubtask,
  handleDeleteSubtask,
} from "../controllers/subTask.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import validate from "../middleware/validation.middleware.js";
import {
  createSubtaskValidator,
  updateSubtaskValidator,
} from "../validators/subTask.validator.js";

const subTaskRouter = Router({ mergeParams: true });

// POST /api/tasks/:taskId/subtasks
subTaskRouter.post(
  "/tasks/:taskId/subtasks",
  requireAuth,
  validate(createSubtaskValidator),
  asyncHandler(handleCreateSubtask)
);

// GET /api/tasks/:taskId/subtasks
subTaskRouter.get(
  "/tasks/:taskId/subtasks",
  requireAuth,
  asyncHandler(handleGetSubtasksByTaskId)
);

// PATCH /api/subtasks/:id
subTaskRouter.patch(
  "/subtasks/:id",
  requireAuth,
  validate(updateSubtaskValidator),
  asyncHandler(handleUpdateSubtask)
);

// DELETE /api/subtasks/:id
subTaskRouter.delete(
  "/subtasks/:id",
  requireAuth,
  asyncHandler(handleDeleteSubtask)
);

// Direct routes when mounted on /api/subtasks
subTaskRouter.patch(
  "/:id",
  requireAuth,
  validate(updateSubtaskValidator),
  asyncHandler(handleUpdateSubtask)
);

subTaskRouter.delete(
  "/:id",
  requireAuth,
  asyncHandler(handleDeleteSubtask)
);

export default subTaskRouter;

