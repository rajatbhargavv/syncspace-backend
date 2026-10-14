import { Space } from "../models/Space.model.js";
import { ICreateSpace, IUpdateSpace } from "../types/space.types.js";
import AppError from "../utils/AppError.js";

export const createSpace = async (data: ICreateSpace) => {
    if (!data.ownerId) {
        throw new AppError("ownerId is required to create a space", 400);
    }

    const newSpace = new Space({
        name: data.name,
        description: data.description,
        ownerId: data.ownerId
    });
    return await newSpace.save();
};

export const getMySpaces = async (userId: string) => {
    return await Space.find({ ownerId: userId }).sort({ createdAt: -1 });
};

export const getSpaceById = async (userId: string, spaceId: string) => {
    return await Space.findOne({ _id: spaceId, ownerId: userId });
};

export const updateSpace = async (userId: string, spaceId: string, updateData: IUpdateSpace) => {
    return await Space.findOneAndUpdate(
        { _id: spaceId, ownerId: userId },
        { $set: updateData },
        { new: true, runValidators: true }
    );
};

export const deactivateSpace = async (userId: string, spaceId: string) => {
    return await Space.findOneAndUpdate(
        { _id: spaceId, ownerId: userId },
        { status: 'Inactive' },
        { new: true }
    );
};