import { SpaceInvite } from "../models/SpaceInvite.model.js";
import { Space } from "../models/Space.model.js";
import { SpaceMember } from "../models/SpaceMember.model.js";
import User from "../models/User.model.js";
import AppError from "../utils/AppError.js";
import { ICreateInvite } from "../types/invite.types.js";
import { createNotification } from "./notification.service.js";

export async function createSpaceInvite(data: ICreateInvite) {
  const space = await Space.findById(data.spaceId);
  if (!space || space.status === "Inactive") {
    throw new AppError("Space not found or inactive", 404);
  }
  if (space.ownerId.toString() !== data.inviterId.toString()) {
    throw new AppError("Only the space owner can create invite links", 403);
  }

  let expiresAt = data.expiresAt;
  if (!expiresAt && data.expiresInHours) {
    expiresAt = new Date(Date.now() + data.expiresInHours * 60 * 60 * 1000);
  }

  const invite = new SpaceInvite({
    spaceId: data.spaceId,
    inviterId: data.inviterId,
    expiresAt,
    maxUses: data.maxUses,
  });

  const saved = await invite.save();
  return {
    invite: saved,
    token: saved.token,
    inviteLink: `/api/spaces/join/${saved.token}`,
    expiresAt: saved.expiresAt,
    maxUses: saved.maxUses,
  };
}

export async function getInvitePreview(token: string) {
  if (!token) {
    throw new AppError("Invite token is required", 400);
  }

  const invite = await SpaceInvite.findOne({ token, status: "ACTIVE" });
  if (!invite) {
    throw new AppError("Invalid or expired invite token", 404);
  }

  if (invite.expiresAt && new Date() > new Date(invite.expiresAt)) {
    throw new AppError("Invite link has expired", 400);
  }

  if (invite.maxUses && invite.uses >= invite.maxUses) {
    throw new AppError("Invite link has reached its maximum uses", 400);
  }

  const space = await Space.findById(invite.spaceId);
  if (!space || space.status === "Inactive") {
    throw new AppError("Space not found or inactive", 404);
  }

  const owner = await User.findById(space.ownerId).select("name").lean();

  return {
    name: space.name,
    kind: space.kind,
    theme: space.theme,
    ownerName: owner?.name || "Unknown",
  };
}

export async function joinSpaceByInvite(token: string, userId: string) {
  if (!token) {
    throw new AppError("Invite token is required", 400);
  }

  const invite = await SpaceInvite.findOne({ token, status: "ACTIVE" });
  if (!invite) {
    throw new AppError("Invalid or expired invite token", 404);
  }

  if (invite.expiresAt && new Date() > new Date(invite.expiresAt)) {
    throw new AppError("Invite link has expired", 400);
  }

  if (invite.maxUses && invite.uses >= invite.maxUses) {
    throw new AppError("Invite link has reached its maximum uses", 400);
  }

  const space = await Space.findById(invite.spaceId);
  if (!space || space.status === "Inactive") {
    throw new AppError("Space not found or inactive", 404);
  }

  if (space.ownerId.toString() === userId.toString()) {
    throw new AppError("Owner is already part of the space", 400);
  }

  const existingMember = await SpaceMember.findOne({
    spaceId: space._id,
    userId,
  });

  if (existingMember && existingMember.status === "ACTIVE") {
    throw new AppError("You are already an active member of this space", 409);
  }

  // Activate membership regardless of joinPolicy
  let member;
  if (existingMember) {
    existingMember.status = "ACTIVE";
    member = await existingMember.save();
  } else {
    member = await SpaceMember.create({
      spaceId: space._id,
      userId,
      status: "ACTIVE",
    });
  }

  // Increment usage
  invite.uses += 1;
  await invite.save();

  try {
    await createNotification([space.ownerId], {
      message: `A new member joined "${space.name}" via invite link`,
      type: "SPACE_MEMBER_JOINED",
      resource: "SPACE",
      resourceId: space._id,
      senderId: userId,
    });
  } catch (err) {
    console.error("Failed to notify owner on invite join:", err);
  }

  return {
    member,
    space: {
      _id: space._id,
      name: space.name,
      kind: space.kind,
      theme: space.theme,
    },
  };
}

