import { NextFunction,Request,Response } from "express";
import AppError from "../utils/AppError.js";
import Joi from "joi";
export default function validate(schema:Joi.ObjectSchema){
   return (req:Request,res:Response,next:NextFunction)=>{
    const result=schema.validate(req.body);
    if(result.error){
        next(new AppError(result.error.message,400))
    }else{
        req.body=result.value;
        next()
    }
   }
}