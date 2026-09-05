import User from "../models/User.model.js";
import AppError from "../utils/AppError.js";
import {IUser} from "../types/user.types.js";
import { ILogin } from "../types/auth.types.js";
import bcrypt from "bcrypt"
import Jwt from "jsonwebtoken"
import { SECRET_KEY } from "../config/env.js";
export async function registerUser(user:IUser){
    const exists=await User.findOne({email:user.email})
    if(exists){
        throw new AppError("Already registered using this email",409);
    }
    const hashedPassword=await bcrypt.hash(user.password,10);
    const newuser=await User.create({
        name:user.name,
        email:user.email,
        password:hashedPassword
    })
    return newuser

}
export async function userLogin(user:ILogin){
    const exists=await User.findOne({email:user.email}).select("+password");
    if(!exists){
        throw new AppError("Invalid email or Password",401);
    }
    const match= await bcrypt.compare(user.password,exists.password);
    if(!match){
         throw new AppError("Invalid email or Password",401);
    }
    const token=Jwt.sign({id:exists._id},SECRET_KEY,{expiresIn:"1d"})
    return token;
}