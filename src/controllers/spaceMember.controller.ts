import {
  getSpaceMembers,
  joinSpace,
  leaveSpace,
  removeMember,
  approveMember,
  rejectMember,
} from "../services/spaceMember.service.js";
import { Request, Response } from "express";

export async function handleJoinSpace(req: Request, res: Response) {
  const userId: string = req.user!.id;
  const spaceId: string = req.params.id as string;
  const member = await joinSpace(spaceId, userId);
  const message =
    member.status === "PENDING"
      ? "Join request submitted successfully and is pending approval"
      : "Successfully joined the space";
  return res.status(200).json({
    message,
    member,
  });
}

export async function handleApproveMember(req: Request, res: Response) {
  const ownerId: string = req.user!.id;
  const spaceId: string = req.params.id as string;
  const userId: string = req.params.userId as string;
  const member = await approveMember(spaceId, ownerId, userId);
  return res.status(200).json({
    message: "Member request approved successfully",
    member,
  });
}

export async function handleRejectMember(req: Request, res: Response) {
  const ownerId: string = req.user!.id;
  const spaceId: string = req.params.id as string;
  const userId: string = req.params.userId as string;
  const result = await rejectMember(spaceId, ownerId, userId);
  return res.status(200).json(result);
}

export async function handleLeaveSpace(req: Request, res: Response) {
  const userId: string = req.user!.id;
  const spaceId: string = req.params.id as string;

  const member = await leaveSpace(spaceId, userId);

  return res.status(200).json({
    message: "Successfully left the space",
    member,
  });
}

export async function handleRemoveMember(req: Request, res: Response) {
  const ownerId: string = req.user!.id;
  const spaceId: string = req.params.id as string;
  const userId: string = req.params.userId as string;

  const member = await removeMember(spaceId, ownerId, userId);

  return res.status(200).json({
    message: "Member removed successfully",
    member,
  });
}

export async function handleGetSpaceMembers(req: Request, res: Response) {
  const spaceId: string = req.params.id as string;
  const status = req.query.status as string | undefined;
  const requesterId = req.user?.id;

  const members = await getSpaceMembers(spaceId, status, requesterId);

  return res.status(200).json({
    members,
  });
}
