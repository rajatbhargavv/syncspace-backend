import Task from "../models/Task.model.js";
import User from "../models/User.model.js";
import { SpaceMember } from "../models/SpaceMember.model.js";
import { Space } from "../models/Space.model.js";
import AppError from "../utils/AppError.js";

export async function getSpaceAnalytics(
  spaceId: string,
  userId: string,
  rangeStr: string = "7d"
) {
  // 1. Find space and check PRO plan on space owner
  const space = await Space.findById(spaceId);
  if (!space || space.status === "Inactive") {
    throw new AppError("Space not found or inactive", 404);
  }

  const spaceOwner = await User.findById(space.ownerId);
  if (!spaceOwner || spaceOwner.plan !== "PRO") {
    // 402 Payment Required
    throw new AppError("Analytics requires the space owner to have a PRO subscription plan", 402);
  }

  // 2. Determine range start date
  const now = new Date();
  let days = 7;
  if (rangeStr === "30d") days = 30;
  else if (rangeStr === "90d") days = 90;

  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  // 3. Get all active tasks for this space
  const allTasks = await Task.find({
    spaceId,
    lifecycleStatus: "ACTIVE",
  }).lean();

  // 4. Overdue count (active, non-completed tasks whose deadline has passed)
  const overdueCount = allTasks.filter(
    (t) => t.progressStatus !== "COMPLETED" && new Date(t.deadline) < now
  ).length;

  // 5. Tasks completed per day in the range
  const completedInRange = allTasks.filter(
    (t) =>
      t.progressStatus === "COMPLETED" &&
      new Date(t.updatedAt) >= startDate
  );

  // Group by day YYYY-MM-DD
  const dayMap = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().split("T")[0];
    dayMap.set(key, 0);
  }
  // Include today
  dayMap.set(now.toISOString().split("T")[0], 0);

  let onTimeCount = 0;
  for (const t of completedInRange) {
    const key = new Date(t.updatedAt).toISOString().split("T")[0];
    dayMap.set(key, (dayMap.get(key) || 0) + 1);

    if (new Date(t.updatedAt) <= new Date(t.deadline)) {
      onTimeCount++;
    }
  }

  const tasksCompletedPerDay = Array.from(dayMap.entries()).map(
    ([date, count]) => ({ date, count })
  );

  // 6. On-time rate
  const onTimeRate =
    completedInRange.length > 0
      ? Math.round((onTimeCount / completedInRange.length) * 100)
      : 100;

  // 7. Get members of the space to compute member-specific stats
  const owner = space
    ? await User.findById(space.ownerId).select("_id name").lean()
    : null;
  const members = await SpaceMember.find({ spaceId, status: "ACTIVE" })
    .populate("userId", "_id name")
    .lean();

  const memberMap = new Map<string, string>();
  if (owner) {
    memberMap.set(owner._id.toString(), owner.name);
  }
  for (const m of members) {
    if (m.userId && (m.userId as any).name) {
      memberMap.set((m.userId as any)._id.toString(), (m.userId as any).name);
    }
  }

  // Completion by member
  const completionMap = new Map<string, number>();
  // Workload per member (open/active tasks)
  const workloadMap = new Map<string, number>();

  for (const [mId] of memberMap) {
    completionMap.set(mId, 0);
    workloadMap.set(mId, 0);
  }

  for (const t of allTasks) {
    if (t.progressStatus === "COMPLETED") {
      // Attribute completion to assignees who are DONE, or creator
      if (t.assignees && t.assignees.length > 0) {
        for (const a of t.assignees) {
          if (a.status === "DONE") {
            const mId = a.userId.toString();
            completionMap.set(mId, (completionMap.get(mId) || 0) + 1);
          }
        }
      } else {
        const creatorId = t.createdBy.toString();
        completionMap.set(creatorId, (completionMap.get(creatorId) || 0) + 1);
      }
    } else {
      // Workload for open tasks
      if (t.assignees && t.assignees.length > 0) {
        for (const a of t.assignees) {
          const mId = a.userId.toString();
          workloadMap.set(mId, (workloadMap.get(mId) || 0) + 1);
        }
      } else {
        const creatorId = t.createdBy.toString();
        workloadMap.set(creatorId, (workloadMap.get(creatorId) || 0) + 1);
      }
    }
  }

  const completionByMember = Array.from(memberMap.entries()).map(
    ([userId, name]) => ({
      userId,
      name,
      completedCount: completionMap.get(userId) || 0,
    })
  );

  const workloadPerMember = Array.from(memberMap.entries()).map(
    ([userId, name]) => ({
      userId,
      name,
      activeTasksCount: workloadMap.get(userId) || 0,
    })
  );

  return {
    range: rangeStr,
    startDate,
    endDate: now,
    tasksCompletedPerDay,
    completionByMember,
    onTimeRate,
    workloadPerMember,
    overdueCount,
  };
}

