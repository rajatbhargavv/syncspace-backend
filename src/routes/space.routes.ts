import express from "express";
import asyncHandler from "../utils/asyncHandler.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import validate from "../middleware/validation.middleware.js";
import { spaceSchema, updateSpaceSchema } from "../validators/space.validator.js";
import { 
    handleCreateSpace, 
    handleDeactivateSpace, 
    handleGetMySpaces, 
    handleGetSpaceByID, 
    handleUpdateSpace 
} from "../controllers/space.controller.js";

const spaceRouter = express.Router();

// Making all these routes accessible to logged in users.
spaceRouter.use(authMiddleware);

spaceRouter.post("/", validate(spaceSchema), asyncHandler(handleCreateSpace));

spaceRouter.get("/", asyncHandler(handleGetMySpaces));

// TODO: Add spaceAccessMiddleware to check if user belongs to this space
spaceRouter.get(":/id", asyncHandler(handleGetMySpaces));

// TODO: Add spaceAccessMiddleware to verify owner/admin privileges
spaceRouter.put("/:id", validate(updateSpaceSchema) ,asyncHandler(handleUpdateSpace));

// todo : add space access middleware to verify owner privileges
spaceRouter.patch("/:id/deactivate", asyncHandler(handleDeactivateSpace));

export default spaceRouter;