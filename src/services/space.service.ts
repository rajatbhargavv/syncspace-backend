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
    const activeMembers = await SpaceMember.find({ spaceId, status: "ACTIVE" }).select("userId").lean();
    const activeMemberCount = activeMembers.length;
    const memberCount = activeMemberCount + 1;

    const totalTasks = await Task.countDocuments({ spaceId, lifecycleStatus: "ACTIVE" });
    const completedTasksCount = await Task.countDocuments({
        spaceId,
        lifecycleStatus: "ACTIVE",
        progressStatus: "COMPLETED",
    });

    let contributors: Array<{
        userId: string;
        name: string;
        tasksCompleted: number;
        share: number;
    }> = [];

    if (space.visibility === "PUBLIC") {
        const eligibleUserIds = new Set<string>();
        eligibleUserIds.add(space.ownerId.toString());
        activeMembers.forEach((m) => eligibleUserIds.add(m.userId.toString()));

        const eligibleUsers = await User.find({
            _id: { $in: Array.from(eligibleUserIds) },
        }).select("_id name").lean();

        const userMap = new Map<string, string>();
        eligibleUsers.forEach((u) => userMap.set(u._id.toString(), u.name || "Unknown"));

        const completionMap = new Map<string, number>();
        eligibleUserIds.forEach((uId) => completionMap.set(uId, 0));

        const completedTasks = await Task.find({
            spaceId,
            lifecycleStatus: "ACTIVE",
            progressStatus: "COMPLETED",
        }).select("assignees createdBy").lean();

        for (const task of completedTasks) {
            if (task.assignees && task.assignees.length > 0) {
                const countedInTask = new Set<string>();
                for (const assignee of task.assignees) {
                    const statusStr = (assignee.status || "").toString();
                    if (statusStr === "DONE" || statusStr === "COMPLETED") {
                        const aId = assignee.userId.toString();
                        if (eligibleUserIds.has(aId) && !countedInTask.has(aId)) {
                            countedInTask.add(aId);
                            completionMap.set(aId, (completionMap.get(aId) || 0) + 1);
                        }
                    }
                }
            }
        }

        const contributorList = Array.from(eligibleUserIds).map((userId) => {
            const tasksCompleted = completionMap.get(userId) || 0;
            const share = completedTasksCount > 0
                ? Math.round((tasksCompleted / completedTasksCount) * 100)
                : 0;
            return {
                userId,
                name: userMap.get(userId) || "Unknown",
                tasksCompleted,
                share,
            };
        });

        contributorList.sort((a, b) => b.tasksCompleted - a.tasksCompleted);
        contributors = contributorList.slice(0, 20);
    }

    return {
        _id: space._id,
        name: space.name,
        description: space.description,
        kind: space.kind,
        theme: space.theme,
        visibility: space.visibility,
        joinPolicy: space.joinPolicy,
        status: space.status,
        memberCount,
        createdAt: space.createdAt,
        owner: {
            _id: space.ownerId,
            name: owner?.name || "Unknown",
        },
        contributorStats: {
            totalContributors: memberCount,
            totalTasks,
            completedTasks: completedTasksCount,
        },
        contributors,
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
