import express from "express";
import asyncHandler from "../utils/asyncHandler.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { 
    handleGetSpaceMembers, 
    handleJoinSpace, 
    handleLeaveSpace, 
    handleRemoveMember 
} from "../controllers/spaceMember.controller.js";

const spaceMemberRouter = express.Router();
// using the authentication middleware before every route
spaceMemberRouter.use(authMiddleware);

// creating the routes on proper endpoints and calling the controller

// 1. route for joining the space
spaceMemberRouter.post("/:id/join", asyncHandler(handleJoinSpace));

// 2. route for leaving the space
spaceMemberRouter.post("/:id/leave", asyncHandler(handleLeaveSpace));

// 3. route for getting all the space members of a space
spaceMemberRouter.get("/:id/members", asyncHandler(handleGetSpaceMembers));

// 4. route for removing a particular space member from space
spaceMemberRouter.delete("/:id/members/:userId", asyncHandler(handleRemoveMember));

export default spaceMemberRouter;