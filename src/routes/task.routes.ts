import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import {
  handleCreateTask,
  handleGetTaskById,
  handleDeleteTask,
} from "../controllers/task.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireSpaceMember } from "../middleware/spaceAccess.middleware.js";
import validate from "../middleware/validation.middleware.js";
import { createTaskSchema } from "../validators/task.validator.js";

const taskRouter = Router();
taskRouter.use(requireAuth);

taskRouter.post(
  "/",
  validate(createTaskSchema),
  requireSpaceMember,
  asyncHandler(handleCreateTask)
);

taskRouter.get("/:id", asyncHandler(handleGetTaskById));
taskRouter.delete("/:id", asyncHandler(handleDeleteTask));

export default taskRouter;

