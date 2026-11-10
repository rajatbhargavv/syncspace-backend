import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import validate from "../middleware/validation.middleware.js";
import {
  subscribePushSchema,
  unsubscribePushSchema,
} from "../validators/push.validator.js";
import {
  handleGetPublicKey,
  handleSubscribe,
  handleUnsubscribe,
  handleTestPush,
} from "../controllers/push.controller.js";

const pushRouter = Router();

// GET /api/push/public-key (no auth required)
pushRouter.get("/public-key", asyncHandler(handleGetPublicKey));

// All subsequent push routes require authentication
pushRouter.use(requireAuth);

// POST /api/push/subscribe
pushRouter.post(
  "/subscribe",
  validate(subscribePushSchema),
  asyncHandler(handleSubscribe)
);

// DELETE /api/push/subscribe
pushRouter.delete(
  "/subscribe",
  validate(unsubscribePushSchema),
  asyncHandler(handleUnsubscribe)
);

// POST /api/push/test (rate-limited 1 per 30s per user)
pushRouter.post("/test", asyncHandler(handleTestPush));

export default pushRouter;
