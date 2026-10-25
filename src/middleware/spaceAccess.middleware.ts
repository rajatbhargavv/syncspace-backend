import { Request, Response, NextFunction } from "express";
import { Space } from "../models/Space.model.js";
import AppError from "../utils/AppError.js";
import { SpaceMember } from "../models/SpaceMember.model.js";


const requireSpaceOwner = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const spaceId = req.params.id || req.params.spaceId || req.body.spaceId;
        if (!spaceId) {
            throw new AppError("Space ID is required", 400);
        }
        const space = await Space.findById(spaceId);
        if (!space || space.status === 'Inactive') {
            throw new AppError("Space not found", 404);
        }
        const userId = req.user?.id;
        if (!userId) {
            throw new AppError("Unauthorized", 401);
        }
        if (space.ownerId.toString() !== userId.toString()) {
            throw new AppError("Only the space owner can perform this action", 403);
        }
        // Attach space to req so downstream controllers don't have to query it again
        req.space = space;
        next();
    } catch (err) {
        next(err);
    }
};

const requireSpaceMember = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const spaceId = req.params.id || req.params.spaceId || req.body.spaceId;
        if(!spaceId) 
            throw new AppError("Space ID is required", 400);
        const space = await Space.findById(spaceId);
        if (!space || space.status === 'Inactive')
            throw new AppError("Space not found", 404);
        const userId = req.user?.id;
        if (!userId)
            throw new AppError("Unauthorized", 401);
        if(space.ownerId.toString() === userId.toString()){
            req.space = space;
            return next();
        }
        const member = await SpaceMember.findOne({
            spaceId: spaceId,
            userId: userId,
            status: "ACTIVE"
        });
        if(!member) 
            throw new AppError("Access denied: You are not a member of this space", 403);

        req.space = space;
        req.spaceMember = member;
        next();
    } catch (error) {
        next(error);
    }
}

export { requireSpaceOwner, requireSpaceMember };