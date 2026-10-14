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
    handleUpdateSpace 
} from "../controllers/space.controller.js";
import { requireSpaceMember, requireSpaceOwner } from "../middleware/spaceAccess.middleware.js";

const spaceRouter = express.Router();

// Making all space routes accessible only to logged in users
spaceRouter.use(requireAuth);

// 1. Create space
spaceRouter.post("/", validate(spaceSchema), asyncHandler(handleCreateSpace));

// 2. Get all spaces belonging to user
spaceRouter.get("/", asyncHandler(handleGetMySpaces));

// 3. Get single space by space ID
spaceRouter.get("/:id", requireSpaceMember, asyncHandler(handleGetSpaceById));

// TODO: Add spaceAccessMiddleware to verify owner/admin privileges
spaceRouter.put("/:id", requireSpaceOwner, validate(updateSpaceSchema) ,asyncHandler(handleUpdateSpace));

// todo : add spaceAccessMiddleware to verify owner privileges
spaceRouter.patch("/:id/deactivate", requireSpaceOwner, asyncHandler(handleDeactivateSpace));

export default spaceRouter;