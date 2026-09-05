import { registerUser,userLogin} from "../services/user.service.js";
import {IUser} from "../types/user.types.js";
import { ILogin } from "../types/auth.types.js";
import { NextFunction, Request, Response } from "express";
import { NODE_ENV } from "../config/env.js";
export async function handleregisterUser(req:Request,res:Response,next:NextFunction){
    const user:IUser=req.body;
    const result=await registerUser(user);
    res.status(201).json({
        message:"Successfully created",
        user:{name:result.name,email:result.email}
    })
}

export async function handleuserLogin(req:Request,res:Response,next:NextFunction){
    const user:ILogin=req.body;
    const token=await userLogin(user);
    res.cookie("token",token,{
        httpOnly:true,
        sameSite:"strict",
        maxAge:24*60*60*1000,
        secure:NODE_ENV==="production"
    })
    res.status(200).json({
        message:"Successfully logged in",
    })
}