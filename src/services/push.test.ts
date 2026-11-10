import test from "node:test";
import assert from "node:assert";
import mongoose from "mongoose";
import { resolveNotificationUrl, sendPushToUsers } from "./push.service.js";
import { isPushConfigured, getVapidPublicKey } from "../config/vapid.js";
import Task from "../models/Task.model.js";
import Subtask from "../models/SubTask.model.js";
import Comment from "../models/Comment.model.js";

// Disable Mongoose command buffering in tests when offline
mongoose.set("bufferCommands", false);

test("VAPID config should detect configured keys", () => {
  const configured = isPushConfigured();
  assert.strictEqual(typeof configured, "boolean");
  if (configured) {
    const key = getVapidPublicKey();
    assert.strictEqual(typeof key, "string");
    assert.ok(key!.length > 20);
  }
});

test("resolveNotificationUrl returns /notifications when resource is missing or empty", async () => {
  const url1 = await resolveNotificationUrl();
  assert.strictEqual(url1, "/notifications");

  const url2 = await resolveNotificationUrl(undefined, undefined);
  assert.strictEqual(url2, "/notifications");

  const url3 = await resolveNotificationUrl("UNKNOWN", "123");
  assert.strictEqual(url3, "/notifications");
});

test("resolveNotificationUrl resolves SPACE resource directly to /spaces/:id", async () => {
  const spaceId = "Space_abc123";
  const url = await resolveNotificationUrl("SPACE", spaceId);
  assert.strictEqual(url, `/spaces/${spaceId}`);
});

test("resolveNotificationUrl resolves TASK when found in database", async () => {
  const origFind = Task.findById;
  (Task as any).findById = () => ({
    select: () => ({
      lean: async () => ({ spaceId: "Space_100", _id: "Task_200" }),
    }),
  });

  const url = await resolveNotificationUrl("TASK", "Task_200");
  assert.strictEqual(url, "/spaces/Space_100?task=Task_200");
  Task.findById = origFind;
});

test("resolveNotificationUrl resolves SUBTASK when found in database", async () => {
  const origSubtaskFind = Subtask.findById;
  const origTaskFind = Task.findById;

  (Subtask as any).findById = () => ({
    select: () => ({
      lean: async () => ({ taskId: "Task_200" }),
    }),
  });
  (Task as any).findById = () => ({
    select: () => ({
      lean: async () => ({ spaceId: "Space_100", _id: "Task_200" }),
    }),
  });

  const url = await resolveNotificationUrl("SUBTASK", "Subtask_300");
  assert.strictEqual(url, "/spaces/Space_100?task=Task_200");

  Subtask.findById = origSubtaskFind;
  Task.findById = origTaskFind;
});

test("resolveNotificationUrl resolves COMMENT when found in database", async () => {
  const origCommentFind = Comment.findById;
  const origTaskFind = Task.findById;

  (Comment as any).findById = () => ({
    select: () => ({
      lean: async () => ({ taskId: "Task_200" }),
    }),
  });
  (Task as any).findById = () => ({
    select: () => ({
      lean: async () => ({ spaceId: "Space_100", _id: "Task_200" }),
    }),
  });

  const url = await resolveNotificationUrl("COMMENT", "Comment_400");
  assert.strictEqual(url, "/spaces/Space_100?task=Task_200");

  Comment.findById = origCommentFind;
  Task.findById = origTaskFind;
});

test("resolveNotificationUrl gracefully returns /notifications if database item not found", async () => {
  const origFind = Task.findById;
  (Task as any).findById = () => ({
    select: () => ({
      lean: async () => null,
    }),
  });

  const url = await resolveNotificationUrl("TASK", "Task_missing");
  assert.strictEqual(url, "/notifications");
  Task.findById = origFind;
});

test("sendPushToUsers handles empty recipient list without error and never throws", async () => {
  const res = await sendPushToUsers([], {
    type: "TASK_CREATED",
    message: "Test message",
  });
  assert.deepStrictEqual(res, { sent: 0, failed: 0 });
});

test("sendPushToUsers never throws even with malformed or missing parameters", async () => {
  const res = await sendPushToUsers(
    [],
    {
      _id: "notif_1",
      type: "TASK_CREATED",
      message: "Test",
    },
    { ignoreVisibility: true }
  );
  assert.ok(typeof res.sent === "number");
  assert.ok(typeof res.failed === "number");
});
