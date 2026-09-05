import { NextFunction,Request,Response } from "express";

export default function asyncHandler(controller:(req:Request,res:Response,next:NextFunction)=>Promise<any>){
    return (req:Request,res:Response,next:NextFunction)=>{
      return controller(req,res,next).catch(next)
    }
}