import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken"
import AppError from "../utils/AppError.js";
import { SECRET_KEY } from "../config/env.js";
export function authMiddleware(req:Request,res:Response,next:NextFunction){
    try{
    const {token}=req.cookies;
    if(!token){
        throw new AppError("Not Authorized",401)
    }
    const check=jwt.verify(token,SECRET_KEY)
    if(check && typeof check!=="string"){
        req.user={id:check.id};
    }
    next()
}catch(err){
    next(new AppError("Not Authorized", 401));
}
   
}