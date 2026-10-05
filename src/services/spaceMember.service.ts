import { Space } from "../models/Space.model.js";
import { SpaceMember } from "../models/SpaceMember.model.js";
import AppError from "../utils/AppError.js";

export async function joinSpace(spaceId:String,userId:String){
    const space=await Space.findById(spaceId)
    if(!space){
        throw new AppError("No such Space exists",404);
    }
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
export async function leaveSpace(spaceId:String,userId:String){
    const space=await Space.findById(spaceId)
    if(!space){
        throw new AppError("No such Space exists",404);
    }
    if(space.ownerID===userId){
      throw new AppError("Owner cannot leave the Space",403);
    }
    const exists=await SpaceMember.findOne({spaceId,userId});
    if(exists){
        if(exists.status==="INACTIVE"){
            throw new AppError("Already not a member of space",409)
        }else{
            exists.status="INACTIVE";
            await exists.save();
            return exists;
        }
    }else{
        throw new AppError("User doesn't exists in this space",404)
    }
}
export async function removeMember(spaceId:String,ownerId:String,userId:String){
    const space=await Space.findById(spaceId)
    if(!space){
        throw new AppError("No such Space exists",404);
    }
    if(space.ownerID!==ownerId){
        throw new AppError("Only owner can remove Member",403);
    }
    if(userId===ownerId){
        throw new AppError("Owner cannot remove themselves",403);
    }
    const exists=await SpaceMember.findOne({spaceId,userId});
    if(!exists){
        throw new AppError("No such member exists in space",404);
    }
    if(exists.status==="INACTIVE"){
        throw new AppError("Already not a member of space",409)
    }
    exists.status="INACTIVE";
    await exists.save();
    return exists;
}
export async function getSpaceMembers(spaceId:String){
    const space=await Space.findById(spaceId)
    if(!space){
        throw new AppError("Space doesn't exists",404);
    }
    const members=await SpaceMember.find({spaceId,status:"ACTIVE"});
    return members;
}