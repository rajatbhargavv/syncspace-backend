import { Request, Response } from "express";
import { getVapidPublicKey, isPushConfigured } from "../config/vapid.js";
import {
  saveSubscription,
  removeSubscription,
} from "../services/pushSubscription.service.js";
import { sendPushToUsers } from "../services/push.service.js";
import AppError from "../utils/AppError.js";

// In-memory rate limiting map for test push: userId -> timestamp
const testRateLimitMap = new Map<string, number>();
const TEST_COOLDOWN_MS = 30_000;

export async function handleGetPublicKey(req: Request, res: Response) {
  if (!isPushConfigured()) {
    throw new AppError(
      "Web push notifications are not configured on this server",
      503
    );
  }

  const publicKey = getVapidPublicKey();
  if (!publicKey) {
    throw new AppError("VAPID public key not found", 404);
  }

  return res.status(200).json({ publicKey });
}

export async function handleSubscribe(req: Request, res: Response) {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError("Unauthorized", 401);
  }

  const { subscription, userAgent } = req.body;
  await saveSubscription(userId, subscription, userAgent);

  return res.status(201).json({
    message: "Push subscription saved successfully",
  });
}

export async function handleUnsubscribe(req: Request, res: Response) {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError("Unauthorized", 401);
  }

  const { endpoint } = req.body;
  await removeSubscription(endpoint, userId);

  return res.status(200).json({
    message: "Push subscription removed successfully",
  });
}

export async function handleTestPush(req: Request, res: Response) {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError("Unauthorized", 401);
  }

  if (!isPushConfigured()) {
    throw new AppError(
      "Web push notifications are not configured on this server",
      503
    );
  }

  const lastTest = testRateLimitMap.get(userId);
  const now = Date.now();
  if (lastTest && now - lastTest < TEST_COOLDOWN_MS) {
    const remainingSeconds = Math.ceil((TEST_COOLDOWN_MS - (now - lastTest)) / 1000);
    throw new AppError(
      `Please wait ${remainingSeconds} seconds before sending another test push.`,
      429
    );
  }
  testRateLimitMap.set(userId, now);

  const sampleNotification = {
    _id: "test_" + now,
    type: "TASK_CREATED",
    message: "This is a test notification from SyncSpace! Push notifications are working.",
    resource: undefined,
    resourceId: undefined,
  };

  const { sent } = await sendPushToUsers([userId], sampleNotification, {
    ignoreVisibility: true,
  });

  return res.status(200).json({
    sent,
  });
}
