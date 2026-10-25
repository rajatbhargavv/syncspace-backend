import express from "express";
import asyncHandler from "../utils/asyncHandler.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import validate from "../middleware/validation.middleware.js";
import { spaceSchema, updateSpaceSchema } from "../validators/space.validator.js";
import { 
    handleCreateSpace, 
    handleDeactivateSpace, 
    handleGetMySpaces, 
    handleGetSpaceById, 
    handleGetPublicSpace,
    handleUpdateSpace 
} from "../controllers/space.controller.js";
import { handleGetSpaceTasks } from "../controllers/task.controller.js";
import { handleGetSpaceAnalytics } from "../controllers/analytics.controller.js";
import {
    handleCreateSpaceInvite,
    handleGetInvitePreview,
    handleJoinSpaceByInvite,
} from "../controllers/invite.controller.js";
import { requireSpaceMember, requireSpaceOwner } from "../middleware/spaceAccess.middleware.js";

const spaceRouter = express.Router();

// Public routes - no auth or membership needed
spaceRouter.get("/public/:id", asyncHandler(handleGetPublicSpace));
spaceRouter.get("/invite/:token/preview", asyncHandler(handleGetInvitePreview));

// Making all protected space routes accessible only to logged in users
spaceRouter.use(requireAuth);

// Join via invite token (auth required, activates membership regardless of joinPolicy)
spaceRouter.post("/join/:token", asyncHandler(handleJoinSpaceByInvite));

// 1. Create space
spaceRouter.post("/", validate(spaceSchema), asyncHandler(handleCreateSpace));

// 2. Get all spaces belonging to user
spaceRouter.get("/", asyncHandler(handleGetMySpaces));

// Create invite link (owner only)
spaceRouter.post("/:id/invites", requireSpaceOwner, asyncHandler(handleCreateSpaceInvite));

// 3. Get single space by space ID
spaceRouter.get("/:id", requireSpaceMember, asyncHandler(handleGetSpaceById));

// 4. Get active tasks for a space
spaceRouter.get("/:id/tasks", requireSpaceMember, asyncHandler(handleGetSpaceTasks));

// 5. Get analytics for a space (PRO only)
spaceRouter.get("/:id/analytics", requireSpaceMember, asyncHandler(handleGetSpaceAnalytics));

// Update space
spaceRouter.put("/:id", requireSpaceOwner, validate(updateSpaceSchema), asyncHandler(handleUpdateSpace));

// Deactivate space
spaceRouter.patch("/:id/deactivate", requireSpaceOwner, asyncHandler(handleDeactivateSpace));

export default spaceRouter;
