import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken"
import AppError from "../utils/AppError.js";
import { SECRET_KEY_ACCESS } from "../config/env.js";
export function authMiddleware(req:Request,res:Response,next:NextFunction){
    try{
    let token = req.cookies?.token;
    if(!token && req.headers.authorization?.startsWith("Bearer")){
        token = req.headers.authorization.split(" ")[1];
    }
    if (!token) {
        throw new AppError("Not Authorized", 401);
    }
    const check=jwt.verify(token,SECRET_KEY_ACCESS)
    if(check && typeof check!=="string"){
        req.user={id:check.id};
    }
    next()
}catch(err){
    next(new AppError("Not Authorized", 401));
}
   
}