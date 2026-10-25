import { Request, Response } from "express";
import {
  createSpaceInvite,
  getInvitePreview,
  joinSpaceByInvite,
} from "../services/invite.service.js";
import AppError from "../utils/AppError.js";

export async function handleCreateSpaceInvite(req: Request, res: Response) {
  const spaceId = req.params.id as string;
  const userId = req.user?.id;
  if (!spaceId) {
    throw new AppError("Space ID is required", 400);
  }
  if (!userId) {
    throw new AppError("Unauthorized", 401);
  }

  const { expiresInHours, maxUses, expiresAt } = req.body;
  const result = await createSpaceInvite({
    spaceId,
    inviterId: userId,
    expiresInHours,
    expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    maxUses,
  });

  return res.status(201).json({
    message: "Invite created successfully",
    ...result,
  });
}

export async function handleGetInvitePreview(req: Request, res: Response) {
  const token = req.params.token as string;
  if (!token) {
    throw new AppError("Invite token is required", 400);
  }
  const space = await getInvitePreview(token);
  return res.status(200).json({
    message: "Invite preview fetched successfully",
    space,
  });
}

export async function handleJoinSpaceByInvite(req: Request, res: Response) {
  const token = req.params.token as string;
  const userId = req.user?.id;
  if (!token) {
    throw new AppError("Invite token is required", 400);
  }
  if (!userId) {
    throw new AppError("Unauthorized", 401);
  }

  const result = await joinSpaceByInvite(token, userId);
  return res.status(200).json({
    message: "Successfully joined space via invite link",
    ...result,
  });
}

