import { Request, Response } from "express";
import {
  getNotification,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../services/notification.service.js";
import AppError from "../utils/AppError.js";

export async function handleGetNotifications(req: Request, res: Response) {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError("Unauthorized", 401);
  }
  const unreadOnly = req.query.unread === "true";
  const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

  const notifications = await getNotification(userId, unreadOnly, page, limit);
  return res.status(200).json({
    message: "Notifications fetched successfully",
    notifications,
  });
}

export async function handleGetUnreadNotificationCount(req: Request, res: Response) {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError("Unauthorized", 401);
  }
  const unreadCount = await getUnreadNotificationCount(userId);
  return res.status(200).json({
    unreadCount,
  });
}

export async function handleMarkNotificationAsRead(req: Request, res: Response) {
  const userId = req.user?.id;
  const notificationId = req.params.id as string;
  if (!userId) {
    throw new AppError("Unauthorized", 401);
  }
  if (!notificationId) {
    throw new AppError("Notification ID is required", 400);
  }
  const notification = await markNotificationAsRead(userId, notificationId);
  return res.status(200).json({
    message: "Notification marked as read successfully",
    notification,
  });
}

export async function handleMarkAllNotificationsAsRead(req: Request, res: Response) {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError("Unauthorized", 401);
  }
  const result = await markAllNotificationsAsRead(userId);
  return res.status(200).json({
    message: "All notifications marked as read successfully",
    modifiedCount: result.modifiedCount,
  });
}
