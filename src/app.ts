import express from "express";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.routes.js";
import spaceRouter from "./routes/space.routes.js";
import spaceMemberRouter from "./routes/spaceMember.routes.js";
import commentRouter from "./routes/comments.routes.js";
import userRouter from "./routes/user.routes.js";
import taskRouter from "./routes/task.routes.js";
import commentRouter from "./routes/comment.routes.js";
import errorHandler from "./middleware/error.middleware.js";

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use("/api/auth",authRouter);
app.use("/api/user", userRouter);
// both spaceRouter and spaceMemberRouter are subfields of /api/spaces

// spaces and space members
app.use("/api/spaces", spaceRouter);
app.use("/api/spaces", spaceMemberRouter);

// tasks
app.use("/api/tasks", taskRouter);

// comments (handles /api/tasks/:taskId/comments and /api/comments/:commentId)
app.use("/api", commentRouter);
app.use("/api/comments", commentRouter);

app.use(errorHandler);

export default app;