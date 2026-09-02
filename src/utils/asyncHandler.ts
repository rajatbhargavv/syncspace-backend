import { NextFunction,Request,Response } from "express";

export default function asyncHandler(controller:(req:Request,res:Response)=>Promise<any>){
    return (req:Request,res:Response,next:NextFunction)=>{
      controller(req,res).catch(next)
    }
}