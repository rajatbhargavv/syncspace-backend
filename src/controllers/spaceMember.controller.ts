import { getSpaceMembers, joinSpace, leaveSpace, removeMember } from "../services/spaceMember.service.js";
import { Request , Response, NextFunction } from 'express';
export async function handleJoinSpace(req:Request,res:Response){
    const userId:String=req.user!.id
    const spaceId:String=req.params.id as string;
    const member=await joinSpace(spaceId,userId)
    return res.status(200).json({
        message:"Successfully joined the space",
        member
    })
}
export async function handleLeaveSpace(req: Request, res: Response) {
  const userId: string = req.user!.id;
  const spaceId: string = req.params.id as string;

  const member = await leaveSpace(spaceId, userId);

  return res.status(200).json({
    message: "Successfully left the space",
    member
  });
}
export async function handleRemoveMember(req: Request, res: Response) {
  const ownerId: string = req.user!.id;
  const spaceId: string = req.params.id as string;
  const userId: string = req.params.userId as string;

  const member = await removeMember(spaceId, ownerId, userId);

  return res.status(200).json({
    message: "Member removed successfully",
    member
  });
}
export async function handleGetSpaceMembers(req: Request, res: Response) {
  const spaceId: string = req.params.id as string;

  const members = await getSpaceMembers(spaceId);

  return res.status(200).json({
    members
  });
}