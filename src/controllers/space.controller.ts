import { Request, Response, NextFunction } from 'express';

import {
    createSpace,
    getMySpaces,
    getSpaceById,
    getPublicSpace,
    updateSpace,
    deactivateSpace
} from '../services/space.service.js';

import AppError from '../utils/AppError.js';
import { ICreateSpace, IUpdateSpace } from '../types/space.types.js';

// 1. create a new space
export async function handleCreateSpace(req: Request, res: Response, next: NextFunction) {
    const ownerId = req.user?.id || req.body.ownerId;
    if (!ownerId) {
        throw new AppError("OwnerId is required to create a space", 400);
    }
    const spaceData: ICreateSpace = {
        name: req.body.name,
        description: req.body.description,
        ownerId: ownerId,
        kind: req.body.kind,
        theme: req.body.theme,
        visibility: req.body.visibility,
        joinPolicy: req.body.joinPolicy,
        spaceType: req.body.spaceType
    };
    const space = await createSpace(spaceData);
    res.status(201).json({
        message: "Space created successfully",
        space
    });
}

// 2. Get all spaces belonging to current user
export async function handleGetMySpaces(req: Request, res: Response, next: NextFunction) {
    const userId = req.user?.id || (req.query.userId as string);
    if (!userId) {
        throw new AppError("UserId is required", 400);
    }
    const spaces = await getMySpaces(userId);
    res.status(200).json({
        message: "Spaces fetched successfully",
        spaces
    });
}

// 3. Get Space of User by space ID
export async function handleGetSpaceById(req: Request, res: Response, next: NextFunction) {
    // Optimization: Reuse space if already verified and fetched by middleware
    if (req.space) {
        return res.status(200).json({
            message: "space fetched successfully",
            space: req.space
        });
    }
    const userId = req.user?.id || (req.query.userId as string);
    if (!userId) {
        throw new AppError("UserId is required", 400);
    }
    const spaceId = req.params.id as string;
    if (!spaceId) {
        throw new AppError("SpaceId is required", 400);
    }
    const space = await getSpaceById(userId, spaceId);
    if (!space) {
        throw new AppError("Space not found or not authorized", 404);
    }
    res.status(200).json({
        message: "space fetched successfully",
        space
    });
}

// 3b. Get Public Space
export async function handleGetPublicSpace(req: Request, res: Response, next: NextFunction) {
    const spaceId = req.params.id as string;
    if (!spaceId) {
        throw new AppError("SpaceId is required", 400);
    }
    const space = await getPublicSpace(spaceId);
    res.status(200).json({
        message: "Public space fetched successfully",
        space
    });
}

// 4. Update a space
export async function handleUpdateSpace(req: Request, res: Response, next: NextFunction) {
    const userId = req.user?.id;
    const spaceId = req.params.id as string;
    if (!userId) {
        throw new AppError("UserId is required", 400);
    }
    if (!spaceId) {
        throw new AppError("SpaceId is required", 400);
    }
    const updateData: IUpdateSpace = {};
    if (req.body.name !== undefined) {
        updateData.name = req.body.name;
    }
    if (req.body.description !== undefined) {
        updateData.description = req.body.description;
    }
    if (req.body.status !== undefined) {
        updateData.status = req.body.status;
    }
    if (req.body.kind !== undefined) {
        updateData.kind = req.body.kind;
    }
    if (req.body.theme !== undefined) {
        updateData.theme = req.body.theme;
    }
    if (req.body.visibility !== undefined) {
        updateData.visibility = req.body.visibility;
    }
    if (req.body.joinPolicy !== undefined) {
        updateData.joinPolicy = req.body.joinPolicy;
    }

    const space = await updateSpace(userId, spaceId, updateData);
    if (!space) {
        throw new AppError("Space not authorized or found", 400);
    }
    res.status(200).json({
        message: "Space updated successfully",
        space
    });
}

// 5. Deactivate a Space
export async function handleDeactivateSpace(req: Request, res: Response, next: NextFunction) {
    const userId = req.user?.id || req.body.ownerId;
    const spaceId = req.params.id as string;
    if (!userId) {
        throw new AppError("UserId is required", 400);
    }
    if (!spaceId) {
        throw new AppError("SpaceId is required", 400);
    }
    const space = await deactivateSpace(userId, spaceId);
    if (!space) {
        throw new AppError("Space not found or authorized", 404);
    }
    res.status(200).json({
        message: "Space deactivated successfully",
        space
    });
}
