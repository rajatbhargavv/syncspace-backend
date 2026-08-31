import { NextFunction,Request,Response} from "express";
import AppError from "../utils/AppError";

export default function errorHandler(err:Error,req:Request,res:Response,next:NextFunction){
    let statusCode:number=500;
    if(err instanceof AppError){
    statusCode=err.statusCode||500;
    }
    let message:string=err.message||"Something went wrong";
    return res.status(statusCode).json({
        message
    })

}