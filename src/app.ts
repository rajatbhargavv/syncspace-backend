import express from "express";
import cookieParser from "cookie-parser";
import path from "node:path";
import fs from "node:fs";
import authRouter from "./routes/auth.routes.js";
import spaceRouter from "./routes/space.routes.js";
import spaceMemberRouter from "./routes/spaceMember.routes.js";
import userRouter from "./routes/user.routes.js";
import taskRouter from "./routes/task.routes.js";
import commentRouter from "./routes/comment.routes.js";
import subTaskRouter from "./routes/subTask.routes.js";
import notificationRouter from "./routes/notification.routes.js";
import pushRouter from "./routes/push.routes.js";
import errorHandler from "./middleware/error.middleware.js";
import { FRONTEND_DIST_PATH } from "./config/env.js";

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/users", userRouter);

// spaces and space members
app.use("/api/spaces", spaceRouter);
app.use("/api/spaces", spaceMemberRouter);

// tasks
app.use("/api/tasks", taskRouter);

// subtasks (handles /api/tasks/:taskId/subtasks and /api/subtasks/:id)
app.use("/api", subTaskRouter);
app.use("/api/subtasks", subTaskRouter);

// comments (handles /api/tasks/:taskId/comments and /api/comments/:commentId)
app.use("/api", commentRouter);
app.use("/api/comments", commentRouter);

// notifications and push
app.use("/api/notifications", notificationRouter);
app.use("/api/push", pushRouter);

// Optional production static serving
if (FRONTEND_DIST_PATH && fs.existsSync(FRONTEND_DIST_PATH)) {
  const resolvedDist = path.resolve(FRONTEND_DIST_PATH);

  app.use(
    express.static(resolvedDist, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith("sw.js")) {
          // Service worker must never be cached by browser and needs root scope allowance
          res.setHeader("Service-Worker-Allowed", "/");
          res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        } else if (
          filePath.endsWith("manifest.webmanifest") ||
          filePath.endsWith("manifest.json")
        ) {
          res.setHeader("Cache-Control", "no-cache");
        } else if (filePath.includes("/assets/")) {
          // Hashed static assets can be cached aggressively
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        }
      },
    })
  );

  // SPA fallback for non-API / non-socket.io requests
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/socket.io")) {
      return next();
    }
    const indexHtml = path.join(resolvedDist, "index.html");
    if (fs.existsSync(indexHtml)) {
      return res.sendFile(indexHtml);
    }
    next();
  });
}

app.use(errorHandler);

export default app;
