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
subTaskRouter.use(requireAuth);

// POST /api/tasks/:taskId/subtasks
subTaskRouter.post(
  "/tasks/:taskId/subtasks",
  validate(createSubtaskValidator),
  asyncHandler(handleCreateSubtask)
);

// GET /api/tasks/:taskId/subtasks
subTaskRouter.get(
  "/tasks/:taskId/subtasks",
  asyncHandler(handleGetSubtasksByTaskId)
);

// PATCH /api/subtasks/:id
subTaskRouter.patch(
  "/subtasks/:id",
  validate(updateSubtaskValidator),
  asyncHandler(handleUpdateSubtask)
);

// DELETE /api/subtasks/:id
subTaskRouter.delete(
  "/subtasks/:id",
  asyncHandler(handleDeleteSubtask)
);

// Direct routes when mounted on /api/subtasks
subTaskRouter.patch(
  "/:id",
  validate(updateSubtaskValidator),
  asyncHandler(handleUpdateSubtask)
);

subTaskRouter.delete(
  "/:id",
  asyncHandler(handleDeleteSubtask)
);

export default subTaskRouter;

