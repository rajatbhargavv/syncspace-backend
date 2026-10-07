import { appendFile } from "node:fs";
import { Space } from "../models/Space.model.js";
import AppError from "../utils/AppError.js";

const requireSpaceOwner = (req, res) => {
    const spaceID = req.params.id || req.params.spaceID || req.body.spaceID;
    if(!spaceID) throw new AppError("Space Id is required", 400);
    const space = Space.findById(spaceID);
    if(!space || space.status === 'Inactice')
        throw new AppError("Space not found", 404);
    const OwnerID = req.user.id.toString();
    if(ownerID !== space.ownerID.toString()) 
        throw new AppError("Only the space owner can perform this action", 403);
    
}