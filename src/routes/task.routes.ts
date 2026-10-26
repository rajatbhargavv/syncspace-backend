
import { Router } from "express";

import {
    createTask,
    getTasks,
    getTaskById,
    updateTask,
    deleteTask,
    assignTask,
    updateAssigneeStatus,
    completeTask,
} from "../controllers/task.controller.js";

import {
    taskSchema,
    updateTaskSchema,
    assignTaskSchema,
    updateAssigneeStatusSchema,
    taskQuerySchema,
} from "../validators/task.validator.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import validate from "../middleware/validation.middleware.js";
import asyncHandler from "../utils/asyncHandler.js";

const router = Router();

router.use(requireAuth);


// GET /api/tasks
// Get tasks with filters, pagination and sorting
router.get(
    "/",
    validate(taskQuerySchema, "query"),
    asyncHandler(getTasks)
);

// POST /api/tasks
// Create a task
router.post(
    "/",
    validate(taskSchema),
    asyncHandler(createTask)
);

// GET /api/tasks/:taskId
// Get one task with its details
router.get(
    "/:taskId",
    asyncHandler(getTaskById)
);

// PATCH /api/tasks/:taskId
// Update task title, description, priority or deadline
router.patch(
    "/:taskId",
    validate(updateTaskSchema),
    asyncHandler(updateTask)
);

// PATCH /api/tasks/:taskId/assignees
// Assign or reassign task members
router.patch(
    "/:taskId/assignees",
    validate(assignTaskSchema),
    asyncHandler(assignTask)
);

// PATCH /api/tasks/:taskId/assignees/:userId/status
// Update an assignee's individual progress
router.patch(
    "/:taskId/assignees/:userId/status",
    validate(updateAssigneeStatusSchema),
    asyncHandler(updateAssigneeStatus)
);

// PATCH /api/tasks/:taskId/complete
// Task Owner manually completes a task
router.patch(
    "/:taskId/complete",
    asyncHandler(completeTask)
);

// DELETE /api/tasks/:taskId
// Soft-delete a task (lifecycleStatus = DELETED)
router.delete(
    "/:taskId",
    asyncHandler(deleteTask)
);

export default router;