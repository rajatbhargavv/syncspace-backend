import { queryObjects } from "node:v8";
import User from "../models/User.model.js";
import { IUpdateUser } from "../types/user.types.js";
import AppError from "../utils/AppError.js";
import bcrypt from "bcrypt"
export async function getCurrentUser(userId:string){
    const exists=await User.findById(userId);
    if(!exists){
        throw new AppError("No such user exists",404);
    }
    return exists;
}
export async function updateUser(userId:string,updateData:IUpdateUser){
        const exists=await User.findById(userId);
        if(!exists){
            throw new AppError("User not found",404);
        }
        const details:IUpdateUser={};
        if(updateData.password){
            const hashedPassword=await bcrypt.hash(updateData.password,10);
            details["password"]=hashedPassword;
        }
        if(updateData.name){
            details["name"]=updateData.name;
        }
        if(updateData.email){
            const old=await User.findOne({email:updateData.email,_id:{
                $ne:userId
            }});
            if(old){
                throw new AppError("Email already exists",409);
            }
            details["email"]=updateData.email;
        }
        if(Object.keys(details).length==0){
            throw new AppError("Their is no Change",400);
        }
        return await User.findOneAndUpdate({_id:userId},details,{
            runValidators:true,
            new:true
        })
}

