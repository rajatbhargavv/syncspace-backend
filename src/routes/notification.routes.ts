import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  handleGetNotifications,
  handleGetUnreadNotificationCount,
  handleMarkNotificationAsRead,
  handleMarkAllNotificationsAsRead,
} from "../controllers/notification.controller.js";

const notificationRouter = Router();

notificationRouter.use(requireAuth);

notificationRouter.get("/", asyncHandler(handleGetNotifications));
notificationRouter.get("/unread-count", asyncHandler(handleGetUnreadNotificationCount));
notificationRouter.patch("/read-all", asyncHandler(handleMarkAllNotificationsAsRead));
notificationRouter.patch("/:id/read", asyncHandler(handleMarkNotificationAsRead));

export default notificationRouter;

