import { registerUser,userLogin} from "../services/user.service";
import {IUser,ILogin} from "../types/user.types";
import { Request, Response } from "express";
export async function handleregisterUser(req:Request,res:Response){
    const user:IUser=req.body;
    const result=await registerUser(user);
    res.status(201).json({
        message:"Successfully created",
        user:result
    })
}

export async function handleuserLogin(req:Request,res:Response){
    const user:ILogin=req.body;
    const token=await userLogin(user);
    res.cookie("token",token,{
        httpOnly:true,
        sameSite:"strict",
        maxAge:24*60*60*1000
    })
    res.status(200).json({
        message:"Successfully logged in",
    })
}