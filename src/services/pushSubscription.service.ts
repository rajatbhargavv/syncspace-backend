import { PushSubscription } from "../models/PushSubscription.model.js";
import { IPushSubscription, IPushSubscriptionKeys } from "../types/push.types.js";

const MAX_DEVICES_PER_USER = 10;

export async function saveSubscription(
  userId: string,
  subscription: {
    endpoint: string;
    keys: IPushSubscriptionKeys;
  },
  userAgent?: string
): Promise<IPushSubscription> {
  const existing = await PushSubscription.findOne({ endpoint: subscription.endpoint });

  let savedSub: IPushSubscription;

  if (existing) {
    // Reassign endpoint to current user (e.g. shared device or account switch)
    existing.userId = userId;
    existing.keys = {
      p256dh: subscription.keys.p256dh.trim(),
      auth: subscription.keys.auth.trim(),
    };
    if (userAgent !== undefined) {
      existing.userAgent = userAgent.trim();
    }
    savedSub = await existing.save();
  } else {
    savedSub = await PushSubscription.create({
      userId,
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh.trim(),
        auth: subscription.keys.auth.trim(),
      },
      userAgent: userAgent ? userAgent.trim() : undefined,
    });
  }

  // Cap at 10 devices per user by deleting the oldest
  const userSubs = await PushSubscription.find({ userId }).sort({ createdAt: -1 });
  if (userSubs.length > MAX_DEVICES_PER_USER) {
    const toDelete = userSubs.slice(MAX_DEVICES_PER_USER).map((s) => s._id);
    await PushSubscription.deleteMany({ _id: { $in: toDelete } });
  }

  return savedSub;
}

export async function removeSubscription(
  endpoint: string,
  userId: string
): Promise<void> {
  // Idempotent removal
  await PushSubscription.deleteOne({ endpoint, userId });
}

export async function listForUsers(
  userIds: string[]
): Promise<IPushSubscription[]> {
  if (!userIds || userIds.length === 0) return [];
  return await PushSubscription.find({ userId: { $in: userIds } });
}

export async function removeByEndpoint(endpoint: string): Promise<void> {
  await PushSubscription.deleteMany({ endpoint });
}
