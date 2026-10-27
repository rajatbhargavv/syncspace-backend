import { Router, RequestHandler } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import {
  handleCreateSubtask,
  handleDeleteSubtask,
  handleGetSubtaskById,
  handleGetSubtasksByTaskId,
} from "../controllers/subTask.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import validate from "../middleware/validation.middleware.js";
import { subTaskValidator } from "../validators/subTask.validator.js";

const subTaskRouter = Router();
subTaskRouter.use(requireAuth);

const copyTaskIdToBody: RequestHandler = (req, _res, next) => {
  req.body = {
    ...req.body,
    taskId: req.params.taskId,
  };
  next();
};

// Create and list subtasks for a task.
subTaskRouter.post(
  "/tasks/:taskId/subtasks",
  copyTaskIdToBody,
  validate(subTaskValidator),
  asyncHandler(handleCreateSubtask)
);
subTaskRouter.get(
  "/tasks/:taskId/subtasks",
  asyncHandler(handleGetSubtasksByTaskId)
);

// Also support creating a subtask with taskId in the request body.
subTaskRouter.post(
  "/subtasks",
  validate(subTaskValidator),
  asyncHandler(handleCreateSubtask)
);
subTaskRouter.get(
  "/subtasks/:subtaskId",
  asyncHandler(handleGetSubtaskById)
);
subTaskRouter.delete(
  "/subtasks/:subtaskId",
  asyncHandler(handleDeleteSubtask)
);

export default subTaskRouter;