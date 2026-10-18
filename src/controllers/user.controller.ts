import { Request,Response } from "express";
import { deleteUserById, getCurrentUser, getUserById, updateUser } from "../services/user.service.js";
import AppError from "../utils/AppError.js";
import { IUpdateUser } from "../types/user.types.js";
export async function handleGetCurrentUser(req:Request,res:Response){
    const userId=req.user?.id;
    if (!userId) {
      throw new AppError("Not authorized", 401);
    }
    const detail=await getCurrentUser(userId);
    return res.status(200).json({
        user:detail,
        message:"User fetched successfully"
    })
}
export async function handleUpdateUser(req:Request,res:Response){
    const userId=req.user?.id;
    if (!userId) {
      throw new AppError("Not authorized", 401);
    }
    const details:IUpdateUser=req.body;
    const updatedUser=await updateUser(userId,details);
    return res.status(200).json({
        user:updatedUser,
        message:"User updated successfully"
    })
}
export async function handleGetUserById(req:Request,res:Response){
    const id=req.params?.id;
    if(!id || typeof id !== "string"){
        throw new AppError("Valid Id must be provided",400);
    }
    const result=await getUserById(id);
     return res.status(200).json({
        user:result,
        message:"User fetched successfully"
    })
}
export async function handleDeletetUser(req:Request,res:Response){
    const id=req.user?.id;
    if(!id){
       throw new AppError("Not authorized", 401);
    }
    await deleteUserById(id);
    return res.status(200).json({
        message:"User deleted successfully"
    })
}