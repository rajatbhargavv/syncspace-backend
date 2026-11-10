import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import {
  handleCreateTask,
  handleGetTaskById,
  handleUpdateTask,
  handleDeleteTask,
  handleAddAssignee,
  handleRemoveAssignee,
  handleUpdateMyAssigneeStatus,
} from "../controllers/task.controller.js";
import { handleGetTaskTimeline } from "../controllers/comment.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireSpaceMember, requireTaskMember } from "../middleware/spaceAccess.middleware.js";
import validate from "../middleware/validation.middleware.js";
import {
  createTaskSchema,
  updateTaskSchema,
  addAssigneeSchema,
  updateAssigneeStatusSchema,
} from "../validators/task.validator.js";

const taskRouter = Router();
taskRouter.use(requireAuth);

// Create task in a space
taskRouter.post(
  "/",
  validate(createTaskSchema),
  requireSpaceMember,
  asyncHandler(handleCreateTask)
);

// My assignee status update: /api/tasks/:id/assignees/me
taskRouter.patch(
  "/:id/assignees/me",
  requireTaskMember,
  validate(updateAssigneeStatusSchema),
  asyncHandler(handleUpdateMyAssigneeStatus)
);

// Add assignee
taskRouter.post(
  "/:id/assignees",
  requireTaskMember,
  validate(addAssigneeSchema),
  asyncHandler(handleAddAssignee)
);

// Remove assignee
taskRouter.delete(
  "/:id/assignees/:userId",
  requireTaskMember,
  asyncHandler(handleRemoveAssignee)
);

// Get task by id
taskRouter.get("/:id", requireTaskMember, asyncHandler(handleGetTaskById));

// Get task timeline
taskRouter.get("/:id/timeline", requireTaskMember, asyncHandler(handleGetTaskTimeline));

// Update task
taskRouter.patch(
  "/:id",
  requireTaskMember,
  validate(updateTaskSchema),
  asyncHandler(handleUpdateTask)
);

// Delete task
taskRouter.delete("/:id", requireTaskMember, asyncHandler(handleDeleteTask));

export default taskRouter;
