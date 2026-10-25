import express from "express";
import asyncHandler from "../utils/asyncHandler.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { 
    handleGetSpaceMembers, 
    handleJoinSpace, 
    handleLeaveSpace, 
    handleRemoveMember,
    handleApproveMember,
    handleRejectMember,
} from "../controllers/spaceMember.controller.js";
import { requireSpaceMember, requireSpaceOwner } from "../middleware/spaceAccess.middleware.js";

const spaceMemberRouter = express.Router();
// using the authentication middleware before every route
spaceMemberRouter.use(requireAuth);

// 1. route for joining the space
spaceMemberRouter.post("/:id/join", asyncHandler(handleJoinSpace));

// 2. route for leaving the space
spaceMemberRouter.post("/:id/leave", asyncHandler(handleLeaveSpace));

// 3. route for getting all the space members of a space
spaceMemberRouter.get("/:id/members", requireSpaceMember, asyncHandler(handleGetSpaceMembers));

// 4. route for removing a particular space member from space
spaceMemberRouter.delete("/:id/members/:userId", requireSpaceOwner, asyncHandler(handleRemoveMember));

// 5. routes for approving/rejecting join requests (owner only)
spaceMemberRouter.post("/:id/members/:userId/approve", requireSpaceOwner, asyncHandler(handleApproveMember));
spaceMemberRouter.patch("/:id/members/:userId/approve", requireSpaceOwner, asyncHandler(handleApproveMember));

spaceMemberRouter.post("/:id/members/:userId/reject", requireSpaceOwner, asyncHandler(handleRejectMember));
spaceMemberRouter.patch("/:id/members/:userId/reject", requireSpaceOwner, asyncHandler(handleRejectMember));
spaceMemberRouter.delete("/:id/members/:userId/reject", requireSpaceOwner, asyncHandler(handleRejectMember));

export default spaceMemberRouter;
