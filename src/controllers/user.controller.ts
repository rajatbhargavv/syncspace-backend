import { Request,Response } from "express";
import { getCurrentUser } from "../services/user.service.js";
import AppError from "../utils/AppError.js";
export async function handleGetCurrentUser(req:Request,res:Response){
    const userId=req.user?.id;
    if (!userId) {
      throw new AppError("Not authorized", 401);
    }
    const detail=await getCurrentUser(userId);
    return res.status(200).json({
        user:detail,
        message:"User fetched successfully "
    })
}