import User from "../models/User.model.js";
import { IUpdateUser, UserPlan } from "../types/user.types.js";
import AppError from "../utils/AppError.js";
import bcrypt from "bcrypt";
import { Space } from "../models/Space.model.js";
import { SpaceMember } from "../models/SpaceMember.model.js";
import Task from "../models/Task.model.js";

export async function getCurrentUser(userId: string) {
  const exists = await User.findById(userId).select("_id name email plan createdAt");
  if (!exists) {
    throw new AppError("No such user exists", 404);
  }
  return exists;
}

export async function getUserById(userId: string) {
  const exists = await User.findById(userId).select("_id name createdAt");
  if (!exists) {
    throw new AppError("No such user exists", 404);
  }
  return exists;
}

export async function getUserProfile(userId: string) {
  const user = await User.findById(userId).select("_id name isDeleted createdAt").lean();
  if (!user || user.isDeleted) {
    throw new AppError("User not found", 404);
  }

  // Find PUBLIC spaces owned by this user
  const ownedSpaces = await Space.find({
    ownerId: userId,
    visibility: "PUBLIC",
    status: "Active",
  }).lean();

  // Find PUBLIC spaces where user is an active member
  const memberships = await SpaceMember.find({
    userId,
    status: "ACTIVE",
  }).lean();
  const membershipMap = new Map(memberships.map((m) => [m.spaceId.toString(), m]));
  const memberSpaceIds = memberships.map((m) => m.spaceId);

  const memberSpaces = await Space.find({
    _id: { $in: memberSpaceIds },
    ownerId: { $ne: userId },
    visibility: "PUBLIC",
    status: "Active",
  }).lean();

  const allPublicSpaces = [...ownedSpaces, ...memberSpaces];
  const allSpaceIds = allPublicSpaces.map((s) => s._id);

  const activeMemberCounts = await SpaceMember.aggregate([
    { $match: { spaceId: { $in: allSpaceIds }, status: "ACTIVE" } },
    { $group: { _id: "$spaceId", count: { $sum: 1 } } },
  ]);
  const memberCountMap = new Map<string, number>();
  activeMemberCounts.forEach((c) => memberCountMap.set(c._id.toString(), c.count));

  const spacesList: Array<{
    _id: string;
    name: string;
    description: string;
    kind: string;
    theme: unknown;
    memberCount: number;
    joinedAt: Date;
    role: "OWNER" | "MEMBER";
    stats: {
      tasksCompleted: number;
      contributionShare: number; // percentage
    };
  }> = [];

  for (const space of ownedSpaces) {
    const totalCompletedInSpace = await Task.countDocuments({
      spaceId: space._id,
      lifecycleStatus: "ACTIVE",
      progressStatus: "COMPLETED",
    });

    const userCompleted = await Task.countDocuments({
      spaceId: space._id,
      lifecycleStatus: "ACTIVE",
      progressStatus: "COMPLETED",
      $or: [
        { assignees: { $elemMatch: { userId, status: { $in: ["DONE", "COMPLETED"] } } } },
        { createdBy: userId },
      ],
    });

    const contributionShare =
      totalCompletedInSpace > 0
        ? Math.round((userCompleted / totalCompletedInSpace) * 100)
        : 0;

    spacesList.push({
      _id: space._id,
      name: space.name,
      description: space.description || "",
      kind: space.kind,
      theme: space.theme,
      memberCount: (memberCountMap.get(space._id.toString()) || 0) + 1,
      joinedAt: membershipMap.get(space._id.toString())?.joinedAt || space.createdAt,
      role: "OWNER",
      stats: {
        tasksCompleted: userCompleted,
        contributionShare,
      },
    });
  }

  for (const space of memberSpaces) {
    const totalCompletedInSpace = await Task.countDocuments({
      spaceId: space._id,
      lifecycleStatus: "ACTIVE",
      progressStatus: "COMPLETED",
    });

    const userCompleted = await Task.countDocuments({
      spaceId: space._id,
      lifecycleStatus: "ACTIVE",
      progressStatus: "COMPLETED",
      assignees: { $elemMatch: { userId, status: { $in: ["DONE", "COMPLETED"] } } },
    });

    const contributionShare =
      totalCompletedInSpace > 0
        ? Math.round((userCompleted / totalCompletedInSpace) * 100)
        : 0;

    spacesList.push({
      _id: space._id,
      name: space.name,
      description: space.description || "",
      kind: space.kind,
      theme: space.theme,
      memberCount: (memberCountMap.get(space._id.toString()) || 0) + 1,
      joinedAt: membershipMap.get(space._id.toString())?.joinedAt || space.createdAt,
      role: "MEMBER",
      stats: {
        tasksCompleted: userCompleted,
        contributionShare,
      },
    });
  }

  const publicSpacesCount = spacesList.length;
  const totalTasksCompleted = spacesList.reduce(
    (sum, s) => sum + s.stats.tasksCompleted,
    0,
  );

  return {
    name: user.name,
    joinedAt: user.createdAt,
    totalTasksCompleted,
    publicSpacesCount,
    spaces: spacesList,
  };
}

export async function deleteUser(userId: string) {
  const exists = await User.findById(userId);
  if (!exists) {
    throw new AppError("No such user exists", 404);
  }
  if (exists && exists.isDeleted) {
    throw new AppError("User is already deleted", 409);
  }
  const spaces = await Space.find({ ownerId: userId });
  for (const space of spaces) {
    if (space.spaceType === "Shared") {
      const members = await SpaceMember.find({
        spaceId: space._id,
        status: "ACTIVE",
      });
      if (members.length === 0) {
        await Space.deleteOne({ _id: space._id });
      } else {
        const randomIndex = Math.floor(Math.random() * members.length);
        const newOwner = members[randomIndex];
        space.ownerId = newOwner.userId;
        await space.save();
        await SpaceMember.deleteOne({
          spaceId: space._id,
          userId: newOwner.userId,
        });
      }
    } else {
      await Space.deleteOne({ _id: space._id });
    }
  }
  await User.updateOne({ _id: userId }, { isDeleted: true });
  return;
}

export async function updateUser(userId: string, updateData: IUpdateUser) {
  const exists = await User.findById(userId);
  if (!exists) {
    throw new AppError("User not found", 404);
  }
  const details: IUpdateUser = {};
  if (updateData.password) {
    const hashedPassword = await bcrypt.hash(updateData.password, 10);
    details["password"] = hashedPassword;
  }
  if (updateData.name) {
    details["name"] = updateData.name;
  }
  if (updateData.email) {
    const old = await User.findOne({
      email: updateData.email,
      _id: {
        $ne: userId,
      },
    });
    if (old) {
      throw new AppError("Email already exists", 409);
    }
    details["email"] = updateData.email;
  }
  if (updateData.plan) {
    details["plan"] = updateData.plan;
  }
  if (Object.keys(details).length === 0) {
    throw new AppError("There is no change", 400);
  }
  return await User.findOneAndUpdate({ _id: userId }, details, {
    runValidators: true,
    new: true,
  }).select("_id name email plan createdAt");
}

export async function updateUserPlan(userId: string, plan: UserPlan) {
  // TODO: Production Billing Integration (Stripe / Paddle webhook integration)
  const user = await User.findByIdAndUpdate(
    userId,
    { plan },
    { new: true, runValidators: true }
  ).select("_id name email plan createdAt");
  if (!user) {
    throw new AppError("User not found", 404);
  }
  return user;
}
