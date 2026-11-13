import { Space } from "../models/Space.model.js";
import { SpaceMember } from "../models/SpaceMember.model.js";
import ActivityEvent from "../models/ActivityEvent.model.js";
import Task from "../models/Task.model.js";
import User from "../models/User.model.js";
import { logActivityEvent } from "./activityEvent.service.js";
import { ICreateSpace, IUpdateSpace } from "../types/space.types.js";
import { ITaskAssignee } from "../types/task.types.js";
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
    spaceType: data.spaceType || "Shared",
  });
  return await newSpace.save();
};

export const getMySpaces = async (userId: string) => {
  const ownedSpaces = await Space.find({ ownerId: userId }).lean();

  const memberships = await SpaceMember.find({
    userId,
    status: "ACTIVE",
  }).lean();
  const memberSpaceIds = memberships.map((m) => m.spaceId);

  const memberSpaces = await Space.find({
    _id: { $in: memberSpaceIds },
    ownerId: { $ne: userId },
  }).lean();

  const allSpaceIds = [
    ...ownedSpaces.map((s) => s._id),
    ...memberSpaces.map((s) => s._id),
  ];
  const activeMemberCounts = await SpaceMember.aggregate([
    { $match: { spaceId: { $in: allSpaceIds }, status: "ACTIVE" } },
    { $group: { _id: "$spaceId", count: { $sum: 1 } } },
  ]);
  const memberCountMap = new Map<string, number>();
  activeMemberCounts.forEach((c) => memberCountMap.set(c._id, c.count));

  const result = [
    ...ownedSpaces.map((space) => ({
      ...space,
      myRole: "OWNER" as const,
      memberCount: (memberCountMap.get(space._id) || 0) + 1,
    })),
    ...memberSpaces.map((space) => ({
      ...space,
      myRole: "MEMBER" as const,
      memberCount: (memberCountMap.get(space._id) || 0) + 1,
    })),
  ];

  result.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  return result;
};

export const searchDiscoverableSpaces = async (search?: string) => {
  const query = search?.trim();
  const filter: Record<string, unknown> = {
    status: "Active",
    visibility: "PUBLIC",
    joinPolicy: { $in: ["REQUEST", "OPEN"] },
  };
  if (query) {
    filter.$or = [
      { name: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
    ];
  }

  const spaces = await Space.find(filter)
    .select("_id name description kind theme visibility joinPolicy ownerId createdAt updatedAt")
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
  const ownerIds = spaces.map((space) => space.ownerId);
  const owners = await User.find({ _id: { $in: ownerIds } }).select("name").lean();
  const ownerNames = new Map(owners.map((owner) => [owner._id.toString(), owner.name]));

  return spaces.map((space) => ({
    ...space,
    owner: {
      _id: space.ownerId,
      name: ownerNames.get(space.ownerId.toString()) || "Unknown",
    },
  }));
};

export const getSpaceById = async (userId: string, spaceId: string) => {
  const space = await Space.findById(spaceId);
  if (!space) return null;
  if (space.ownerId === userId) return space;
  const isMember = await SpaceMember.findOne({
    spaceId,
    userId,
    status: "ACTIVE",
  });
  if (isMember) return space;
  return null;
};

export const getPublicSpace = async (spaceId: string) => {
  const space = await Space.findById(spaceId).lean();
  if (!space) {
    throw new AppError("Space not found", 404);
  }
  if (space.visibility === "PRIVATE") {
    throw new AppError("Space is private", 404);
  }

  const owner = await User.findById(space.ownerId).select("name").lean();
  const activeMembers = await SpaceMember.find({ spaceId, status: "ACTIVE" })
    .select("userId")
    .lean();
  const activeMemberCount = activeMembers.length;
  const memberCount = activeMemberCount + 1;

  const totalTasks = await Task.countDocuments({
    spaceId,
    lifecycleStatus: "ACTIVE",
  });
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
    })
      .select("_id name")
      .lean();

    const userMap = new Map<string, string>();
    eligibleUsers.forEach((u) =>
      userMap.set(u._id.toString(), u.name || "Unknown"),
    );

    const completionMap = new Map<string, number>();
    eligibleUserIds.forEach((uId) => completionMap.set(uId, 0));

    const completedTasks = await Task.find({
      spaceId,
      lifecycleStatus: "ACTIVE",
      progressStatus: "COMPLETED",
    })
      .select("assignees createdBy")
      .lean();

    for (const task of completedTasks) {
      let attributed = false;
      if (task.assignees && task.assignees.length > 0) {
        const countedInTask = new Set<string>();
        for (const assignee of task.assignees) {
          const statusStr = (assignee.status || "").toString();
          if (statusStr === "DONE" || statusStr === "COMPLETED") {
            const aId = assignee.userId.toString();
            if (eligibleUserIds.has(aId) && !countedInTask.has(aId)) {
              countedInTask.add(aId);
              completionMap.set(aId, (completionMap.get(aId) || 0) + 1);
              attributed = true;
            }
          }
        }
      }
      if (!attributed) {
        const creatorId = task.createdBy.toString();
        if (eligibleUserIds.has(creatorId)) {
          completionMap.set(creatorId, (completionMap.get(creatorId) || 0) + 1);
        }
      }
    }

    const contributorList = Array.from(eligibleUserIds)
      .map((userId) => {
        const tasksCompleted = completionMap.get(userId) || 0;
        const share =
          completedTasksCount > 0
            ? Math.round((tasksCompleted / completedTasksCount) * 100)
            : 0;
        return {
          userId,
          name: userMap.get(userId) || "Unknown",
          tasksCompleted,
          share,
        };
      })
      .filter((contributor) => contributor.tasksCompleted > 0);

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
      totalContributors: contributors.length,
      totalTasks,
      completedTasks: completedTasksCount,
    },
    contributors,
  };
};

export const updateSpace = async (
  userId: string,
  spaceId: string,
  updateData: IUpdateSpace,
) => {
  return await Space.findOneAndUpdate(
    { _id: spaceId, ownerId: userId },
    { $set: updateData },
    { new: true, runValidators: true },
  );
};

export const deactivateSpace = async (userId: string, spaceId: string) => {
  return await Space.findOneAndUpdate(
    { _id: spaceId, ownerId: userId },
    { status: "Inactive" },
    { new: true },
  );
};
export const searchSpaceMembers = async (
  spaceId: string,
  search: string,
  userId: string,
) => {
  const exists = await Space.findOne({ _id: spaceId, status: "Active" });
  if (!exists) {
    throw new AppError("Space does not exists", 404);
  }
  const isOwner = exists.ownerId === userId;
  const member = await SpaceMember.findOne({
    spaceId,
    userId,
    status: "ACTIVE",
  });
  if (!isOwner && !member) {
    throw new AppError("You are not allowed to search members", 403);
  }
  const validUsers = await SpaceMember.find(
    { spaceId, status: "ACTIVE" },
    { userId: 1, _id: 0 },
  );
  let validIds = validUsers.map((user) => user.userId);
  validIds = [...new Set([...validIds, exists.ownerId])];
  const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const users = await User.find({
    _id: {
      $in: validIds,
    },
    isDeleted: false,
    name: {
      $regex: escapedSearch,
      $options: "i",
    },
  })
    .select("name")
    .sort({ name: 1 })
    .limit(10)
    .lean();
  return users;
};

export const distributeTasksEqually = async (spaceId: string, actorId: string) => {
  const space = await Space.findById(spaceId).lean();
  if (!space || space.status === "Inactive") {
    throw new AppError("Space not found or inactive", 404);
  }

  const owner = await User.findById(space.ownerId).select("plan").lean();
  if (!owner || owner.plan !== "PRO") {
    throw new AppError("Equal task distribution requires a PRO subscription", 402);
  }

  const activeMembers = await SpaceMember.find({
    spaceId,
    status: "ACTIVE",
  })
    .select("userId joinedAt")
    .sort({ joinedAt: 1, _id: 1 })
    .lean();
  const memberIds = [
    space.ownerId.toString(),
    ...activeMembers.map((member) => member.userId.toString()),
  ].filter((userId, index, ids) => ids.indexOf(userId) === index);

  const activeTasks = await Task.find({
    spaceId,
    lifecycleStatus: "ACTIVE",
    progressStatus: { $ne: "COMPLETED" },
  })
    .select("_id progressStatus assignees")
    .sort({ createdAt: 1, _id: 1 })
    .lean();

  if (activeTasks.length > 0) {
    await Task.bulkWrite(
      activeTasks.map((task, index) => ({
        updateOne: {
          filter: { _id: task._id },
          update: {
            $set: {
              assignees: [
                {
                  userId: memberIds[index % memberIds.length],
                  status: task.progressStatus === "IN_PROGRESS" ? "IN_PROGRESS" : "TODO",
                },
              ],
            },
          },
        },
      })),
    );
  }

  await logActivityEvent({
    spaceId,
    actorId,
    type: "TASKS_DISTRIBUTED",
    meta: {
      taskCount: activeTasks.length,
      memberCount: memberIds.length,
      previousAssignments: activeTasks.map((task) => ({
        taskId: task._id,
        assignees: task.assignees,
      })),
    },
  });

  return { updatedCount: activeTasks.length };
};

export const getDistributionUndoStatus = async (spaceId: string) => {
  const event = await ActivityEvent.findOne({
    spaceId,
    type: "TASKS_DISTRIBUTED",
    "meta.undone": { $ne: true },
  })
    .sort({ createdAt: -1 })
    .select("_id")
    .lean();

  return { canUndo: Boolean(event) };
};

export const undoTaskDistribution = async (spaceId: string, actorId: string) => {
  const space = await Space.findById(spaceId).lean();
  if (!space || space.status === "Inactive") {
    throw new AppError("Space not found or inactive", 404);
  }

  const owner = await User.findById(space.ownerId).select("plan").lean();
  if (!owner || owner.plan !== "PRO") {
    throw new AppError("Restoring task distribution requires a PRO subscription", 402);
  }

  const event = await ActivityEvent.findOne({
    spaceId,
    type: "TASKS_DISTRIBUTED",
    "meta.undone": { $ne: true },
  })
    .sort({ createdAt: -1 })
    .lean();
  if (!event) {
    throw new AppError("There is no task distribution to restore", 409);
  }

  const snapshots = Array.isArray(event.meta?.previousAssignments)
    ? event.meta.previousAssignments
    : [];
  const updates = snapshots
    .filter(isTaskAssignmentSnapshot)
    .map((snapshot) => ({
      updateOne: {
        filter: { _id: snapshot.taskId, spaceId, lifecycleStatus: "ACTIVE" as const },
        update: { $set: { assignees: snapshot.assignees } },
      },
    }));

  if (updates.length > 0) {
    await Task.bulkWrite(updates);
  }

  await ActivityEvent.updateOne(
    { _id: event._id },
    { $set: { "meta.undone": true } },
  );
  await logActivityEvent({
    spaceId,
    actorId,
    type: "TASKS_DISTRIBUTION_UNDONE",
    meta: { restoredCount: updates.length },
  });

  return { restoredCount: updates.length };
};

function isTaskAssignmentSnapshot(
  snapshot: unknown,
): snapshot is { taskId: string; assignees: ITaskAssignee[] } {
  if (typeof snapshot !== "object" || snapshot === null || !("taskId" in snapshot)) {
    return false;
  }
  if (!("assignees" in snapshot) || typeof snapshot.taskId !== "string") {
    return false;
  }
  return (
    Array.isArray(snapshot.assignees) &&
    snapshot.assignees.every(
      (assignee) =>
        typeof assignee === "object" &&
        assignee !== null &&
        "userId" in assignee &&
        typeof assignee.userId === "string" &&
        "status" in assignee &&
        (assignee.status === "TODO" ||
          assignee.status === "IN_PROGRESS" ||
          assignee.status === "DONE"),
    )
  );
}
