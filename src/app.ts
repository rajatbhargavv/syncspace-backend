import express from "express"
import authRouter from "./routes/auth.routes.js"
import spaceRouter from "./routes/space.routes.js";
import cookieParser from "cookie-parser";
import errorHandler from "./middleware/error.middleware.js";
import spaceMemberRouter from "./routes/spaceMember.routes.js";
import commentRouter from "./routes/comments.routes.js";
import userRouter from "./routes/user.routes.js";

const app=express();
app.use(express.json());
app.use(cookieParser());
app.use("/api/auth",authRouter);
app.use("/api/user", userRouter);
// both spaceRouter and spaceMemberRouter are subfields of /api/spaces
app.use("/api/spaces", spaceRouter);
app.use("/api/spaces", spaceMemberRouter);
app.use("/api/comments", commentRouter);
app.use(errorHandler);
export default app;