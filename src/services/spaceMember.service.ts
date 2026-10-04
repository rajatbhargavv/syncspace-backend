import { SpaceMember } from "../models/SpaceMember.model.js";
import AppError from "../utils/AppError.js";

async function joinSpace(spaceId:String,userId:String){
    const exists=await SpaceMember.findOne({spaceId,userId});
    if(exists){
        if(exists.status==="ACTIVE"){
            throw new AppError("Already a member",409)
        }
        return await SpaceMember.findOneAndUpdate({
            spaceId,userId
        },{$set:{
            status:"ACTIVE"
        }},{runValidators:true,new:true})
    }
    const member=await SpaceMember.create({
        spaceId,
        userId,
    })
    return member;
}
