import Notification from "../models/Notification.model.js";
import User from "../models/User.model.js";
import type { INotification } from "../types/notification.types.js";
import { getIo } from "../websocket/socket.server.js";
import AppError from "../utils/AppError.js";

type NotificationData = Omit<
  INotification,
  "_id" | "recipientId" | "isRead" | "createdAt" | "updatedAt"
>;

type Query = {
  recipientId: string;
  isRead?: boolean;
};

export async function createNotification(
  recipientIds: string[],
  data: NotificationData
) {
  if (recipientIds.length === 0) return [];
  const notificationObjects = [...new Set(recipientIds)].map((recipientId) => {
    return {
      recipientId,
      ...data,
    };
  });
  const savedNotifications = await Notification.insertMany(notificationObjects);
  try {
    const io = getIo();
    savedNotifications.forEach((not) => {
      io.to(`user:${not.recipientId}`).emit("notification", not);
    });
  } catch {
    // Socket not initialized or error, ignore
  }
  return savedNotifications;
}

export async function getNotification(
  userId: string,
  unReadOnly: boolean = false,
  page: number = 1,
  limit: number = 20
) {
  const exists = await User.findById(userId);
  if (!exists) {
    throw new AppError("User does not exist", 404);
  }
  if (page < 1) {
    page = 1;
  }
  if (limit < 1) {
    limit = 1;
  }
  limit = Math.min(limit, 100);
  let skip: number = (page - 1) * limit;
  let query: Query = { recipientId: userId };
  if (unReadOnly) {
    query["isRead"] = false;
  }
  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
  return notifications;
}

export async function getUnreadNotificationCount(userId: string) {
  const exists = await User.findById(userId);
  if (!exists) {
    throw new AppError("User does not exist", 404);
  }
  return await Notification.countDocuments({
    recipientId: userId,
    isRead: false,
  });
}

export async function markNotificationAsRead(
  userId: string,
  notificationId: string
) {
  const exists = await User.findById(userId);
  if (!exists) {
    throw new AppError("User does not exist", 404);
  }
  const notification = await Notification.findOneAndUpdate(
    { recipientId: userId, _id: notificationId },
    { $set: { isRead: true } },
    { new: true }
  );
  if (!notification) {
    throw new AppError("Notification does not exist", 404);
  }
  return notification;
}

export async function markAllNotificationsAsRead(userId: string) {
  const exists = await User.findById(userId);
  if (!exists) {
    throw new AppError("User does not exist", 404);
  }
  const notifications = await Notification.updateMany(
    { recipientId: userId, isRead: false },
    { $set: { isRead: true } }
  );
  return notifications;
}
