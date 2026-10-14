import User from "../models/User.model.js";
import AppError from "../utils/AppError.js";
export async function getCurrentUser(userId:string){
    const exists=await User.findById(userId);
    if(!exists){
        throw new AppError("No such user exists",404);
    }
    return exists;
}