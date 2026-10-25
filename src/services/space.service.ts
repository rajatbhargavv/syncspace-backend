import { Space } from "../models/Space.model.js";
import { SpaceMember } from "../models/SpaceMember.model.js";
import User from "../models/User.model.js";
import Task from "../models/Task.model.js";
import { ICreateSpace, IUpdateSpace } from "../types/space.types.js";
import AppError from "../utils/AppError.js";

export const createSpace = async (data: ICreateSpace) => {
    if (!data.ownerId) {
        throw new AppError("ownerId is required to create a space", 400);
    }

    const newSpace = new Space({
        name: data.name,
        description: data.description,
        ownerId: data.ownerId,
        kind: data.kind,
        theme: data.theme,
        visibility: data.visibility,
        joinPolicy: data.joinPolicy,
        spaceType: data.spaceType || "Shared"
    });
    return await newSpace.save();
};

export const getMySpaces = async (userId: string) => {
    const ownedSpaces = await Space.find({ ownerId: userId }).lean();

    const memberships = await SpaceMember.find({ userId, status: "ACTIVE" }).lean();
    const memberSpaceIds = memberships.map(m => m.spaceId);

    const memberSpaces = await Space.find({
        _id: { $in: memberSpaceIds },
        ownerId: { $ne: userId }
    }).lean();

    const allSpaceIds = [...ownedSpaces.map(s => s._id), ...memberSpaces.map(s => s._id)];
    const activeMemberCounts = await SpaceMember.aggregate([
        { $match: { spaceId: { $in: allSpaceIds }, status: "ACTIVE" } },
        { $group: { _id: "$spaceId", count: { $sum: 1 } } }
    ]);
    const memberCountMap = new Map<string, number>();
    activeMemberCounts.forEach(c => memberCountMap.set(c._id, c.count));

    const result = [
        ...ownedSpaces.map(space => ({
            ...space,
            myRole: "OWNER" as const,
            memberCount: (memberCountMap.get(space._id) || 0) + 1
        })),
        ...memberSpaces.map(space => ({
            ...space,
            myRole: "MEMBER" as const,
            memberCount: (memberCountMap.get(space._id) || 0) + 1
        }))
    ];

    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return result;
};

export const getSpaceById = async (userId: string, spaceId: string) => {
    const space = await Space.findById(spaceId);
    if (!space) return null;
    if (space.ownerId === userId) return space;
    const isMember = await SpaceMember.findOne({ spaceId, userId, status: "ACTIVE" });
    if (isMember) return space;
    return null;
};

export const getPublicSpace = async (spaceId: string) => {
    const space = await Space.findById(spaceId).lean();
    if (!space || space.status === "Inactive") {
        throw new AppError("Space not found", 404);
    }
    if (space.visibility === "PRIVATE") {
        throw new AppError("Space is private", 404);
    }

    const owner = await User.findById(space.ownerId).select("name").lean();
    const activeMemberCount = await SpaceMember.countDocuments({ spaceId, status: "ACTIVE" });
    const totalTasks = await Task.countDocuments({ spaceId, lifecycleStatus: "ACTIVE" });
    const completedTasks = await Task.countDocuments({ spaceId, lifecycleStatus: "ACTIVE", progressStatus: "COMPLETED" });

    return {
        _id: space._id,
        name: space.name,
        description: space.description,
        kind: space.kind,
        theme: space.theme,
        visibility: space.visibility,
        joinPolicy: space.joinPolicy,
        status: space.status,
        createdAt: space.createdAt,
        owner: {
            _id: space.ownerId,
            name: owner?.name || "Unknown"
        },
        contributorStats: {
            totalContributors: activeMemberCount + 1,
            totalTasks,
            completedTasks
        }
    };
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
