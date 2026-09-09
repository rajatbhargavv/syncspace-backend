import { Request , Response, NextFunction } from 'express';

import {
    createSpace,
    getMySpaces,
    getSpaceById,
    updateSpace,
    deactivateSpace
} from '../services/space.service.js';

import AppError from '../utils/AppError.js';
import { ICreateSpace, IUpdateSpace } from '../types/space.types.js';

// 1. create a new space
export async function handleCreateSpace(req: Request, res: Response, next: NextFunction){
    const ownerID = req.user?.id || req.body.ownerID;
    if(!ownerID) {
        throw new AppError("OwnerID is required to create a space", 400);
    }
    const spaceData: ICreateSpace = {
        name:        req.body.name,
        description: req.body.description,
        ownerID:     ownerID
    };
    const space = await createSpace(spaceData);
    res.status(201).json({
        message: "Space created successfully",
        space
    });
}

// 2. Get all spaces belonging to current user
export async function handleGetMySpaces(req: Request, res: Response, next: NextFunction){
    const userID = req.user?.id || (req.query.userID as string);
    if(!userID) {
        throw new AppError("UserID is required", 400);
    }
    const spaces = await getMySpaces(userID);
    res.status(200).json({
        message: "Spaces fetched successfully",
        spaces
    });
}

// 3. Get Space of User by space ID
export async function handleGetSpaceByID(req: Request, res: Response, next: NextFunction){
    const userID = req.user?.id || (req.query.userID as string);
    if(!userID) {
        throw new AppError("UserID is required", 400);
    }
    const spaceID = req.params.id as string;
    if(!spaceID) {
        throw new AppError("SpaceID is required", 400);
    }
    const space = await getSpaceById(userID, spaceID);
    res.status(200).json({
        message: "space fetched successfully",
        space
    });
}

// 4. Update a space
export async function handleUpdateSpace(req: Request, res: Response, next: NextFunction){
    const userID = req.user?.id || req.body.ownerID;
    const spaceID = req.params.id as string;
    if(!userID){
        throw new AppError("UserID is required", 400);
    }
    if(!spaceID){
        throw new AppError("SpaceID is required", 400);
    }
    const updateData: IUpdateSpace = {
        name: req.body.name,
        description: req.body.description,
        status: req.body.status
    };
    const space = await updateSpace(userID, spaceID, updateData);
    if(!space){
        throw new AppError("Space not authorized or found", 400);
    }
    res.status(200).json({
        message: "Space updated successfully",
        space
    });
}

// 5. Deactivate a Space
export async function handleDeactivateSpace(req: Request, res: Response, next: NextFunction){
    const userID = req.user?.id || req.body.ownerID;
    const spaceID = req.params.id as string;
    if(!userID) {
        throw new AppError("UserID is required", 400);
    }
    if(!spaceID) {
        throw new AppError("SpaceIF is required", 400);
    }
    const space = await deactivateSpace(userID, spaceID);
    if(!space) {
        throw new AppError("Space not found or authorized", 404);
    }
    res.status(200).json({
        message:"Space deactivated successfully",
        space
    });
}