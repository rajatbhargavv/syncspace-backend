import { Space } from "../models/Space.model.js";
import { SpaceMember } from "../models/SpaceMember.model.js";
import User from "../models/User.model.js";
import AppError from "../utils/AppError.js";
import { createNotification } from "./notification.service.js";

export async function joinSpace(spaceId: string, userId: string) {
    const space = await Space.findById(spaceId);
    if (!space || space.status === "Inactive") {
        throw new AppError("No such Space exists", 404);
    }
    if (space.ownerId.toString() === userId.toString()) {
        throw new AppError("Owner is already part of the space", 400);
    }

    const exists = await SpaceMember.findOne({ spaceId, userId });
    if (exists) {
        if (exists.status === "ACTIVE") {
            throw new AppError("Already a member", 409);
        }
        if (exists.status === "PENDING") {
            throw new AppError("Join request is already pending", 409);
        }
    }

    const policy = space.joinPolicy || "INVITE_ONLY";

    if (policy === "INVITE_ONLY") {
        throw new AppError("This space is invite only", 403);
    }

    if (policy === "REQUEST") {
        if (exists) {
            exists.status = "PENDING";
            const updated = await exists.save();
            return updated;
        }
        const member = await SpaceMember.create({
            spaceId,
            userId,
            status: "PENDING",
        });
        return member;
    }

    // OPEN join policy
    if (exists) {
        exists.status = "ACTIVE";
        const updated = await exists.save();

        try {
            await createNotification([space.ownerId], {
                message: `A new member joined your space "${space.name}"`,
                type: "SPACE_MEMBER_JOINED",
                resource: "SPACE",
                resourceId: spaceId,
                senderId: userId,
            });
        } catch (err) {
            console.error("Failed to notify space owner on join:", err);
        }

        return updated;
    }

    const member = await SpaceMember.create({
        spaceId,
        userId,
        status: "ACTIVE",
    });

    try {
        await createNotification([space.ownerId], {
            message: `A new member joined your space "${space.name}"`,
            type: "SPACE_MEMBER_JOINED",
            resource: "SPACE",
            resourceId: spaceId,
            senderId: userId,
        });
    } catch (err) {
        console.error("Failed to notify space owner on join:", err);
    }

    return member;
}

export async function approveMember(spaceId: string, ownerId: string, userId: string) {
    const space = await Space.findById(spaceId);
    if (!space) {
        throw new AppError("No such Space exists", 404);
    }
    if (space.ownerId.toString() !== ownerId.toString()) {
        throw new AppError("Only the space owner can approve join requests", 403);
    }

    const member = await SpaceMember.findOne({ spaceId, userId, status: "PENDING" });
    if (!member) {
        throw new AppError("No pending join request found for this user", 404);
    }

    member.status = "ACTIVE";
    const saved = await member.save();

    try {
        await createNotification([userId], {
            message: `Your request to join "${space.name}" has been approved`,
            type: "SPACE_MEMBER_JOINED",
            resource: "SPACE",
            resourceId: spaceId,
            senderId: ownerId,
        });
    } catch (err) {
        console.error("Failed to notify member on approval:", err);
    }

    return saved;
}

export async function rejectMember(spaceId: string, ownerId: string, userId: string) {
    const space = await Space.findById(spaceId);
    if (!space) {
        throw new AppError("No such Space exists", 404);
    }
    if (space.ownerId.toString() !== ownerId.toString()) {
        throw new AppError("Only the space owner can reject join requests", 403);
    }

    const member = await SpaceMember.findOne({ spaceId, userId, status: "PENDING" });
    if (!member) {
        throw new AppError("No pending join request found for this user", 404);
    }

    await SpaceMember.deleteOne({ _id: member._id });
    return { message: "Join request rejected successfully" };
}

export async function leaveSpace(spaceId: string, userId: string) {
    const space = await Space.findById(spaceId);
    if (!space) {
        throw new AppError("No such Space exists", 404);
    }
    if (space.ownerId.toString() === userId.toString()) {
        throw new AppError("Owner cannot leave the Space", 403);
    }
    const exists = await SpaceMember.findOne({ spaceId, userId });
    if (exists) {
        if (exists.status === "INACTIVE") {
            throw new AppError("Already not a member of space", 409);
        } else {
            exists.status = "INACTIVE";
            await exists.save();

            try {
                await createNotification([space.ownerId], {
                    message: `A member has left your space "${space.name}"`,
                    type: "SPACE_MEMBER_LEFT",
                    resource: "SPACE",
                    resourceId: spaceId,
                    senderId: userId,
                });
            } catch (err) {
                console.error("Failed to notify space owner on leave:", err);
            }

            return exists;
        }
    } else {
        throw new AppError("User doesn't exists in this space", 404);
    }
}

export async function removeMember(spaceId: string, ownerId: string, userId: string) {
    const space = await Space.findById(spaceId);
    if (!space) {
        throw new AppError("No such Space exists", 404);
    }
    if (space.ownerId.toString() !== ownerId.toString()) {
        throw new AppError("Only owner can remove Member", 403);
    }
    if (userId.toString() === ownerId.toString()) {
        throw new AppError("Owner cannot remove themselves", 403);
    }
    const exists = await SpaceMember.findOne({ spaceId, userId });
    if (!exists) {
        throw new AppError("No such member exists in space", 404);
    }
    if (exists.status === "INACTIVE") {
        throw new AppError("Already not a member of space", 409);
    }
    exists.status = "INACTIVE";
    await exists.save();

    try {
        await createNotification([userId], {
            message: `You were removed from "${space.name}"`,
            type: "SPACE_MEMBER_LEFT",
            resource: "SPACE",
            resourceId: spaceId,
            senderId: ownerId,
        });
    } catch (err) {
        console.error("Failed to notify removed member:", err);
    }

    return exists;
}

export async function getSpaceMembers(
  spaceId: string,
  status?: string,
  requesterId?: string
) {
  const space = await Space.findById(spaceId);
  if (!space) {
    throw new AppError("Space doesn't exists", 404);
  }

  if (status === "PENDING") {
    if (!requesterId || space.ownerId.toString() !== requesterId.toString()) {
      throw new AppError("Only the space owner can view pending requests", 403);
    }

    const pendingMembers = await SpaceMember.find({ spaceId, status: "PENDING" })
      .populate("userId", "_id name")
      .lean();

    return pendingMembers.map((m) => ({
      _id: m._id,
      userId: m.userId,
      status: m.status,
      joinedAt: m.joinedAt,
    }));
  }

  const owner = await User.findById(space.ownerId).select("_id name").lean();
  const members = await SpaceMember.find({ spaceId, status: "ACTIVE" })
    .populate("userId", "_id name")
    .lean();

  const ownerEntry = {
    userId: owner || { _id: space.ownerId, name: "Owner" },
    role: "OWNER" as const,
    status: "ACTIVE" as const,
    joinedAt: space.createdAt,
  };

  const memberEntries = members.map((m) => ({
    _id: m._id,
    userId: m.userId,
    role: "MEMBER" as const,
    status: m.status,
    joinedAt: m.joinedAt,
  }));

  return [ownerEntry, ...memberEntries];
}
