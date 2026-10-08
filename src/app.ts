import express from "express"
import authRouter from "./routes/auth.routes.js"
import spaceRouter from "./routes/space.routes.js";
import cookieParser from "cookie-parser";
import errorHandler from "./middleware/error.middleware.js";
import spaceMemberRouter from "./routes/spaceMember.routes.js";

const app=express();
app.use(express.json());
app.use(cookieParser());
app.use("/api/auth",authRouter);

// both spaceRouter and spaceMemberRouter are subfields of /api/spaces
app.use("/api/spaces", spaceRouter);
app.use("/api/spaces", spaceMemberRouter);
app.use(errorHandler);
export default app;