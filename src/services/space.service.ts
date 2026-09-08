import { Space } from "../models/Space.model.js";
import { ICreateSpace, IUpdateSpace } from "../types/space.types.js";
import AppError from "../utils/AppError.js";

export const createSpace = async (data: ICreateSpace) => {
    if (!data.ownerID) {
        throw new AppError("ownerID is required to create a space", 400);
    }

    const newSpace = new Space({
        name: data.name,
        description: data.description,
        ownerID: data.ownerID
    });
    return await newSpace.save();
};

export const getMySpaces = async (userID: string) => {
    return await Space.find({ ownerID: userID }).sort({ createdAt: -1 });
};

export const getSpaceById = async (userID: string, spaceID: string) => {
    return await Space.findOne({ _id: spaceID, ownerID: userID });
};

export const updateSpace = async (userID: string, spaceID: string, updateData: IUpdateSpace) => {
    return await Space.findOneAndUpdate(
        { _id: spaceID, ownerID: userID },
        { $set: updateData },
        { new: true, runValidators: true }
    );
};

export const deactivateSpace = async (userID: string, spaceID: string) => {
    return await Space.findOneAndUpdate(
        { _id: spaceID, ownerID: userID },
        { status: 'Inactive' },
        { new: true }
    );
};