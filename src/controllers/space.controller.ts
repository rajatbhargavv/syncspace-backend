import { Request, Response, NextFunction } from "express";

import {
  createSpace,
  getMySpaces,
  searchDiscoverableSpaces,
  getSpaceById,
  getPublicSpace,
  updateSpace,
  deactivateSpace,
  searchSpaceMembers,
  distributeTasksEqually,
  distributeTasksByTags,
  getDistributionUndoStatus,
  undoTaskDistribution,
} from "../services/space.service.js";

import AppError from "../utils/AppError.js";
import { ICreateSpace, IUpdateSpace } from "../types/space.types.js";

// 1. create a new space
export async function handleCreateSpace(
  req: Request,
  res: Response,
  next: NextFunction,
) {
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
    spaceType: req.body.spaceType,
  };
  const space = await createSpace(spaceData);
  res.status(201).json({
    message: "Space created successfully",
    space,
  });
}

// 2. Get all spaces belonging to current user
export async function handleGetMySpaces(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const userId = req.user?.id || (req.query.userId as string);
  if (!userId) {
    throw new AppError("UserId is required", 400);
  }

  const spaces = await getMySpaces(userId);
  res.status(200).json({
    message: "Spaces fetched successfully",
    spaces,
  });
}

export async function handleSearchDiscoverableSpaces(req: Request, res: Response) {
  const search = typeof req.query.search === "string" ? req.query.search : undefined;
  const spaces = await searchDiscoverableSpaces(search);
  return res.status(200).json({
    message: "Discoverable spaces fetched successfully",
    spaces,
  });
}

export async function handleDistributeTasksEqually(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const spaceId = req.params.id as string;
  const userId = req.user?.id;
  if (!spaceId) {
    throw new AppError("Space ID is required", 400);
  }
  if (!userId) {
    throw new AppError("Unauthorized", 401);
  }

  const result = await distributeTasksEqually(spaceId, userId);
  return res.status(200).json({
    message: "Tasks distributed equally",
    ...result,
  });
}

export async function handleDistributeTasksByTags(
  req: Request,
  res: Response,
) {
  const spaceId = req.params.id as string;
  const userId = req.user?.id;
  if (!spaceId) {
    throw new AppError("Space ID is required", 400);
  }
  if (!userId) {
    throw new AppError("Unauthorized", 401);
  }
  const mappings = req.body.mappings as Array<{ tag: string; userId: string }>;
  const result = await distributeTasksByTags(spaceId, userId, mappings);
  return res.status(200).json({
    message: "Tasks distributed by tags successfully",
    ...result,
  });
}

export async function handleGetDistributionUndoStatus(
  req: Request,
  res: Response,
) {
  const spaceId = req.params.id as string;
  if (!spaceId) {
    throw new AppError("Space ID is required", 400);
  }
  const result = await getDistributionUndoStatus(spaceId);
  return res.status(200).json(result);
}

export async function handleUndoTaskDistribution(
  req: Request,
  res: Response,
) {
  const spaceId = req.params.id as string;
  const userId = req.user?.id;
  if (!spaceId) {
    throw new AppError("Space ID is required", 400);
  }
  if (!userId) {
    throw new AppError("Unauthorized", 401);
  }

  const result = await undoTaskDistribution(spaceId, userId);
  return res.status(200).json({
    message: "Task distribution restored",
    ...result,
  });
}

// 3. Get Space of User by space ID
export async function handleGetSpaceById(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // Optimization: Reuse space if already verified and fetched by middleware
  if (req.space) {
    return res.status(200).json({
      message: "space fetched successfully",
      space: req.space,
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
    space,
  });
}

// 3b. Get Public Space
export async function handleGetPublicSpace(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const spaceId = req.params.id as string;
  if (!spaceId) {
    throw new AppError("SpaceId is required", 400);
  }
  const space = await getPublicSpace(spaceId);
  res.status(200).json({
    message: "Public space fetched successfully",
    space,
  });
}

// 4. Update a space
export async function handleUpdateSpace(
  req: Request,
  res: Response,
  next: NextFunction,
) {
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
  if (req.body.assigneePermission !== undefined) {
    updateData.assigneePermission = req.body.assigneePermission;
  }
  if (req.body.invitePermission !== undefined) {
    updateData.invitePermission = req.body.invitePermission;
  }

  const space = await updateSpace(userId, spaceId, updateData);
  if (!space) {
    throw new AppError("Space not authorized or found", 400);
  }
  res.status(200).json({
    message: "Space updated successfully",
    space,
  });
}

// 5. Deactivate a Space
export async function handleDeactivateSpace(
  req: Request,
  res: Response,
  next: NextFunction,
) {
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
    space,
  });
}
export async function handleSearchSpaceMembers(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError("UserId is required", 400);
  }
  const spaceId = req.params.id as string;
  if (!spaceId) {
    throw new AppError("SpaceId is required", 400);
  }
  const search = typeof req.query.search === "string" ? req.query.search : "";
  const users = await searchSpaceMembers(spaceId, search, userId);
  return res.status(200).json({
    message: "Space members fetched successfully",
    users,
  });
}
