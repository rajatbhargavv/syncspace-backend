import { sendNotification } from "web-push";
import { isPushConfigured } from "../config/vapid.js";
import { getIo } from "../websocket/socket.server.js";
import { listForUsers, removeByEndpoint } from "./pushSubscription.service.js";
import { PushSubscription } from "../models/PushSubscription.model.js";
import Notification from "../models/Notification.model.js";
import Task from "../models/Task.model.js";
import Subtask from "../models/SubTask.model.js";
import Comment from "../models/Comment.model.js";
import { IPushPayload } from "../types/push.types.js";

const TITLE_MAP: Record<string, string> = {
  TASK_COMMENT: "New comment",
  TASK_CREATED: "New task",
  TASK_COMPLETED: "Task completed",
  ASSIGNEE_TASK_COMPLETED: "Task completed",
  SUBTASK_CREATED: "New subtask",
  ASSIGNEE_SUBTASK_COMPLETED: "Subtask completed",
  SPACE_MEMBER_JOINED: "New member",
  SPACE_MEMBER_LEFT: "Member left",
};

export async function resolveNotificationUrl(
  resource?: string,
  resourceId?: string
): Promise<string> {
  if (!resource || !resourceId) {
    return "/notifications";
  }

  try {
    if (resource === "SPACE") {
      return `/spaces/${resourceId}`;
    }

    if (resource === "TASK") {
      const task = await Task.findById(resourceId).select("spaceId").lean();
      if (task?.spaceId) {
        return `/spaces/${task.spaceId}?task=${resourceId}`;
      }
      return "/notifications";
    }

    if (resource === "SUBTASK") {
      const subtask = await Subtask.findById(resourceId).select("taskId").lean();
      if (subtask?.taskId) {
        const task = await Task.findById(subtask.taskId).select("spaceId").lean();
        if (task?.spaceId) {
          return `/spaces/${task.spaceId}?task=${task._id}`;
        }
      }
      return "/notifications";
    }

    if (resource === "COMMENT") {
      const comment = await Comment.findById(resourceId).select("taskId").lean();
      if (comment?.taskId) {
        const task = await Task.findById(comment.taskId).select("spaceId").lean();
        if (task?.spaceId) {
          return `/spaces/${task.spaceId}?task=${task._id}`;
        }
      }
      return "/notifications";
    }
  } catch (err) {
    // If resolution fails, gracefully fall back to notifications
    console.warn("[Push] URL resolution failed:", err);
  }

  return "/notifications";
}

export interface SendPushOptions {
  ignoreVisibility?: boolean;
}

export async function sendPushToUsers(
  recipientIds: string[],
  notification: {
    _id?: string;
    type: string;
    message: string;
    resource?: string;
    resourceId?: string;
  },
  options: SendPushOptions = {}
): Promise<{ sent: number; failed: number }> {
  try {
    if (!isPushConfigured()) {
      return { sent: 0, failed: 0 };
    }

    if (!recipientIds || recipientIds.length === 0) {
      return { sent: 0, failed: 0 };
    }

    const uniqueRecipients = [...new Set(recipientIds)];

    // 1. Filter out users who have a connected socket with visible === true
    let io: any = null;
    try {
      io = getIo();
    } catch {
      // Socket.io not initialized
    }

    const targetUserIds: string[] = [];
    for (const userId of uniqueRecipients) {
      let isVisible = false;
      if (!options.ignoreVisibility && io) {
        try {
          const sockets = await io.in(`user:${userId}`).fetchSockets();
          if (sockets.some((s: any) => s.data?.visible === true)) {
            isVisible = true;
          }
        } catch {
          isVisible = false;
        }
      }
      if (!isVisible) {
        targetUserIds.push(userId);
      }
    }

    if (targetUserIds.length === 0) {
      return { sent: 0, failed: 0 };
    }

    // 2. Load push subscriptions for targets
    const subscriptions = await listForUsers(targetUserIds);
    if (!subscriptions || subscriptions.length === 0) {
      return { sent: 0, failed: 0 };
    }

    // 3. Batched queries: resolve URL once, and aggregate unread counts per user
    const resolvedUrl = await resolveNotificationUrl(
      notification.resource,
      notification.resourceId
    );

    const unreadCounts = await Notification.aggregate([
      { $match: { recipientId: { $in: targetUserIds }, isRead: false } },
      { $group: { _id: "$recipientId", count: { $sum: 1 } } },
    ]);
    const unreadMap = new Map<string, number>();
    unreadCounts.forEach((u) => unreadMap.set(u._id.toString(), u.count));

    const title =
      TITLE_MAP[notification.type] || "SyncSpace notification";
    const tag = `${notification.type}:${notification.resourceId ?? notification._id ?? "alert"}`;
    const safeTopic = tag.replace(/[^a-zA-Z0-9-_.~]/g, "_").slice(0, 32);

    const pushOptions = {
      TTL: 86400, // 24 hours
      urgency: "normal" as const,
      topic: safeTopic || undefined,
    };

    // 4. Send with Promise.allSettled
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        const payloadData: IPushPayload = {
          notificationId: notification._id,
          type: notification.type,
          title,
          body: notification.message,
          url: resolvedUrl,
          tag,
          unreadCount: unreadMap.get(sub.userId.toString()) || 0,
          icon: "/pwa-192x192.png",
        };

        const payloadString = JSON.stringify(payloadData);

        try {
          await sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.keys.p256dh,
                auth: sub.keys.auth,
              },
            },
            payloadString,
            pushOptions
          );

          await PushSubscription.updateOne(
            { _id: sub._id },
            { $set: { lastSuccessAt: new Date() } }
          );

          return { success: true };
        } catch (err: any) {
          if (err?.statusCode === 404 || err?.statusCode === 410) {
            // Subscription expired or unregistered on push service
            await removeByEndpoint(sub.endpoint);
            console.log(
              `[Push] Pruned invalid subscription (HTTP ${err.statusCode})`
            );
          } else {
            console.warn(
              `[Push] Failed to deliver push notification (HTTP ${err?.statusCode || "unknown"})`
            );
          }
          throw err;
        }
      })
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    return { sent, failed };
  } catch (fatalErr) {
    // push service must NEVER throw into callers
    console.error("[Push] Unexpected error in sendPushToUsers:", fatalErr);
    return { sent: 0, failed: 0 };
  }
}
