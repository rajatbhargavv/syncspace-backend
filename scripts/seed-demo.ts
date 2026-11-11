import bcrypt from "bcrypt";
import mongoose from "mongoose";

import { connectDb } from "../src/config/db.js";
import { NODE_ENV } from "../src/config/env.js";
import ActivityEvent from "../src/models/ActivityEvent.model.js";
import Comment from "../src/models/Comment.model.js";
import { Space } from "../src/models/Space.model.js";
import { SpaceMember } from "../src/models/SpaceMember.model.js";
import Subtask from "../src/models/SubTask.model.js";
import Task from "../src/models/Task.model.js";
import User from "../src/models/User.model.js";
import { ITask } from "../src/types/task.types.js";

const DEMO_DOMAIN = "@demo.syncspace.dev";
const DEMO_PASSWORD = "DemoPass123!";
const TASK_COUNT = 48;

const userNames = ["Aarav Mehta", "Maya Chen", "Noah Williams", "Isha Patel", "Leo Martins"];
const spaceDefinitions = [
  {
    name: "Our Home",
    kind: "OUR_HOME" as const,
    description: "A shared place for home projects, errands, and routines.",
    preset: "HEARTH" as const,
    visibility: "PRIVATE" as const,
    joinPolicy: "INVITE_ONLY" as const,
  },
  {
    name: "Builders Circle",
    kind: "BUILDERS_CIRCLE" as const,
    description: "A focused workspace for shipping ideas and learning together.",
    preset: "NEON_GRID" as const,
    visibility: "PRIVATE" as const,
    joinPolicy: "INVITE_ONLY" as const,
  },
  {
    name: "Studio",
    kind: "STUDIO" as const,
    description: "An open creative studio for experiments and collaboration.",
    preset: "IVORY_INK" as const,
    visibility: "PUBLIC" as const,
    joinPolicy: "OPEN" as const,
  },
];

const taskTitles = [
  "Plan the next sprint",
  "Refresh the project brief",
  "Review the latest feedback",
  "Prepare the weekly update",
  "Organize the shared resources",
  "Draft the launch checklist",
  "Set up the research board",
  "Polish the onboarding flow",
  "Map the customer journey",
  "Document the new workflow",
  "Schedule the planning session",
  "Close out open questions",
];

const commentTexts = [
  "This is looking good. I will take the next pass.",
  "Can we review this together during the next check-in?",
  "I added the supporting notes to the shared folder.",
  "The latest version matches the direction we discussed.",
  "Let us keep this moving and flag anything that blocks us.",
  "I will verify the remaining details before the deadline.",
  "This is ready for a final review from the group.",
  "The small follow-up items are captured in the subtasks.",
  "Nice progress here. The result is already much clearer.",
  "I found one edge case and added it to the acceptance notes.",
];

const subtaskTitles = [
  "Collect the source material",
  "Draft the first version",
  "Review and polish the result",
];

function dateDaysFromNow(days: number, hour = 12): Date {
  const date = new Date();
  date.setHours(hour, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date;
}

function dateDaysAgo(days: number, hour = 10): Date {
  return dateDaysFromNow(-days, hour);
}

function taskDate(index: number): Date {
  const ageDays = 3 + ((index * 13) % 87);
  if (index % 9 === 0) return dateDaysAgo(Math.min(ageDays - 1, 14 + (index % 8)));
  return dateDaysFromNow(Math.max(-ageDays + 1, -88 + ((index * 17) % 103)));
}

function taskStatus(index: number): "TODO" | "IN_PROGRESS" | "COMPLETED" {
  if (index % 11 < 6) return "COMPLETED";
  if (index % 11 < 8) return "IN_PROGRESS";
  return "TODO";
}

function priority(index: number): "LOW" | "MEDIUM" | "HIGH" | "URGENT" {
  return ["LOW", "MEDIUM", "HIGH", "URGENT"][index % 4] as
    | "LOW"
    | "MEDIUM"
    | "HIGH"
    | "URGENT";
}

async function removeExistingDemoData(): Promise<void> {
  const demoUsers = await User.find({ email: { $regex: `${DEMO_DOMAIN.replace(/\./g, "\\.")}$` } })
    .select("_id")
    .lean();
  const demoUserIds = demoUsers.map((user) => user._id);
  const demoSpaces = await Space.find({ ownerId: { $in: demoUserIds } }).select("_id").lean();
  const demoSpaceIds = demoSpaces.map((space) => space._id);
  const demoTasks = await Task.find({ spaceId: { $in: demoSpaceIds } }).select("_id").lean();
  const demoTaskIds = demoTasks.map((task) => task._id);

  await Promise.all([
    ActivityEvent.deleteMany({ $or: [{ spaceId: { $in: demoSpaceIds } }, { taskId: { $in: demoTaskIds } }] }),
    Comment.deleteMany({ taskId: { $in: demoTaskIds } }),
    Subtask.deleteMany({ taskId: { $in: demoTaskIds } }),
    Task.deleteMany({ _id: { $in: demoTaskIds } }),
    SpaceMember.deleteMany({ spaceId: { $in: demoSpaceIds } }),
    Space.deleteMany({ _id: { $in: demoSpaceIds } }),
    User.deleteMany({ _id: { $in: demoUserIds } }),
  ]);
}

async function seedDemo(): Promise<void> {
  if (NODE_ENV === "production") {
    throw new Error("Demo seeding is disabled when NODE_ENV is production.");
  }

  await connectDb();
  await removeExistingDemoData();

  const password = await bcrypt.hash(DEMO_PASSWORD, 10);
  const users = await User.insertMany(
    userNames.map((name, index) => ({
      name,
      email: `demo${index + 1}${DEMO_DOMAIN}`,
      password,
      plan: index === 0 ? "PRO" : "FREE",
      isDeleted: false,
    })),
  );
  const owner = users[0];

  const spaces = await Space.insertMany(
    spaceDefinitions.map((definition) => ({
      name: definition.name,
      description: definition.description,
      ownerId: owner._id,
      kind: definition.kind,
      spaceType: "Shared",
      status: "Active",
      theme: { preset: definition.preset, mode: "dark" },
      visibility: definition.visibility,
      joinPolicy: definition.joinPolicy,
    })),
  );

  await SpaceMember.insertMany(
    spaces.flatMap((space) =>
      users.slice(1).map((user, index) => ({
        spaceId: space._id,
        userId: user._id,
        status: "ACTIVE",
        joinedAt: dateDaysAgo(75 - index * 11),
      })),
    ),
  );

  const tasks: mongoose.HydratedDocument<ITask>[] = [];
  const taskEvents: Record<string, unknown>[] = [];
  for (const [spaceIndex, space] of spaces.entries()) {
    const members = users.slice(1);
    for (let index = 0; index < TASK_COUNT; index += 1) {
      const ageDays = 3 + ((index * 13 + spaceIndex * 7) % 87);
      const createdAt = dateDaysAgo(ageDays, 9 + (index % 8));
      const status = taskStatus(index + spaceIndex);
      const assigneeCount = index % 10 === 0 ? 0 : index % 3 === 0 ? 2 : 1;
      const assignees = Array.from({ length: assigneeCount }, (_, assigneeIndex) => ({
        userId: members[(index + assigneeIndex + spaceIndex) % members.length]._id,
        status: status === "COMPLETED" ? "DONE" : status === "IN_PROGRESS" ? "IN_PROGRESS" : "TODO",
      }));
      const task = new Task({
        spaceId: space._id,
        createdBy: owner._id,
        title: `${taskTitles[(index + spaceIndex) % taskTitles.length]} ${index + 1}`,
        description: "A demo task with enough context to show how the workspace is used.",
        priority: priority(index + spaceIndex),
        deadline: taskDate(index + spaceIndex),
        progressStatus: status,
        lifecycleStatus: "ACTIVE",
        assignees,
        createdAt,
        updatedAt: status === "COMPLETED" ? dateDaysAgo(Math.floor(ageDays * ((index % 5 + 1) / 6))) : createdAt,
      });
      await task.save({ timestamps: false });
      tasks.push(task);
      taskEvents.push({
        spaceId: space._id,
        taskId: task._id,
        actorId: task.createdBy,
        type: "TASK_CREATED",
        meta: { title: task.title },
        createdAt,
        updatedAt: createdAt,
      });
      if (status === "COMPLETED") {
        taskEvents.push({
          spaceId: space._id,
          taskId: task._id,
          actorId: assignees[0]?.userId ?? owner._id,
          type: "TASK_STATUS_CHANGED",
          meta: { oldStatus: "IN_PROGRESS", newStatus: "COMPLETED" },
          createdAt: task.updatedAt,
          updatedAt: task.updatedAt,
        });
      }
    }
  }

  const subtasks = [];
  const comments = [];
  const subtaskEvents: Record<string, unknown>[] = [];
  const commentEvents = [];
  for (const [index, task] of tasks.entries()) {
    const taskMembers = users.slice(1);
    const taskAgeDays = Math.max(1, Math.floor((Date.now() - task.createdAt.getTime()) / 86_400_000));
    if (index % 2 === 0) {
      const count = 1 + (index % 3);
      for (let subtaskIndex = 0; subtaskIndex < count; subtaskIndex += 1) {
        const createdAt = dateDaysAgo(Math.min(taskAgeDays - 1, 2 + ((index + subtaskIndex * 9) % 75)), 11);
        const assigneeId = taskMembers[(index + subtaskIndex) % taskMembers.length]._id;
        const subtask = {
          taskId: task._id,
          title: subtaskTitles[subtaskIndex],
          description: "A focused step for the demo task.",
          assigneeId,
          priority: priority(index + subtaskIndex),
          deadline: task.deadline,
          status: task.progressStatus === "COMPLETED" ? "DONE" : subtaskIndex === 0 ? "IN_PROGRESS" : "TODO",
          lifecycleStatus: "ACTIVE",
          createdAt,
          updatedAt: createdAt,
        };
        subtasks.push(subtask);
        subtaskEvents.push({
          spaceId: task.spaceId,
          taskId: task._id,
          actorId: assigneeId,
          type: "SUBTASK_CREATED",
          meta: { title: subtask.title },
          createdAt,
          updatedAt: createdAt,
        });
      }
    }
    if (index % 7 === 0) {
      const count = 5 + (index % 6);
      for (let commentIndex = 0; commentIndex < count; commentIndex += 1) {
        const createdAt = dateDaysAgo(Math.min(taskAgeDays - 1, 1 + ((index + commentIndex * 5) % 60)), 13);
        const userId = taskMembers[(index + commentIndex) % taskMembers.length]._id;
        const comment = new Comment({
          taskId: task._id,
          userId,
          content: commentTexts[commentIndex],
          edited: commentIndex % 5 === 0,
          createdAt,
          updatedAt: createdAt,
        });
        await comment.save({ timestamps: false });
        comments.push(comment);
        commentEvents.push({
          spaceId: task.spaceId,
          taskId: task._id,
          actorId: userId,
          type: "COMMENT_ADDED",
          meta: { commentId: comment._id },
          createdAt,
          updatedAt: createdAt,
        });
      }
    }
  }

  if (subtasks.length > 0) {
    await Subtask.insertMany(subtasks, { timestamps: false });
  }
  if (taskEvents.length + subtaskEvents.length + commentEvents.length > 0) {
    await ActivityEvent.insertMany([...taskEvents, ...subtaskEvents, ...commentEvents], { timestamps: false });
  }

  console.log(`Seeded ${users.length} demo users, ${spaces.length} spaces, and ${tasks.length} tasks.`);
  console.log(`Demo password: ${DEMO_PASSWORD}`);
  users.forEach((user) => console.log(`  ${user.email}`));
}

seedDemo()
  .catch((error) => {
    console.error("Demo seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
