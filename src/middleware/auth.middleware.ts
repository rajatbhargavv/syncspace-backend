import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken"
import AppError from "../utils/AppError.js";
import { SECRET_KEY_ACCESS, SECRET_KEY_REFRESH,NODE_ENV } from "../config/env.js";
export function authMiddleware(req:Request,res:Response,next:NextFunction){
    try{
    let accessToken = req.cookies?.accessToken;
    if(!accessToken && req.headers.authorization?.startsWith("Bearer")){
        accessToken = req.headers.authorization.split(" ")[1];
    }
    if (!accessToken) {
      throw new AppError("Not Authorized",401)
    }
    const check=jwt.verify(accessToken,SECRET_KEY_ACCESS)
    if(check && typeof check!=="string"){
        req.user={id:check.id};
    }
    next();
}catch(err){
    next(new AppError("Not Authorized", 401));
}   
}