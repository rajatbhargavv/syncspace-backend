import { Request, Response, NextFunction } from "express";
import { Space } from "../models/Space.model.js";
import AppError from "../utils/AppError.js";
import { SpaceMember } from "../models/SpaceMember.model.js";


const requireSpaceOwner = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const spaceID = req.params.id || req.params.spaceID || req.body.spaceID;
        if (!spaceID) {
            throw new AppError("Space ID is required", 400);
        }
        const space = await Space.findById(spaceID);
        if (!space || space.status === 'Inactive') {
            throw new AppError("Space not found", 404);
        }
        const userID = req.user?.id;
        if (!userID) {
            throw new AppError("Unauthorized", 401);
        }
        if (space.ownerID.toString() !== userID.toString()) {
            throw new AppError("Only the space owner can perform this action", 403);
        }
        // Attach space to req so downstream controllers don't have to query it again
        (req as any).space = space;
        next();
    } catch (err) {
        next(err);
    }
};

const requireSpaceMember = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const spaceID = req.params.id || req.params.spaceID || req.body.spaceID;
        if(!spaceID) 
            throw new AppError("Space ID is required", 400);
        const space = await Space.findById(spaceID);
        if (!space || space.status === 'Inactive')
            throw new AppError("Space not found", 404);
        const userID = req.user?.id;
        if (!userID)
            throw new AppError("Unauthorized", 401);
        if(space.ownerID.toString() === req.user?.id){
            (req as any).space = space;
            return next();
        }
        const member = await SpaceMember.findOne({
            spaceId: spaceID,
            userId: userID,
            status: "ACTIVE"
        });
        if(!member) 
            throw new AppError("Access denied: You are not a member of this space", 403);

        (req as any).space = space;
        (req as any).spaceMember = member;
        next();
    } catch (error) {
        next(error);
    }
}