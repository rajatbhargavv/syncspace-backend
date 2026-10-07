import express from "express"
import authRouter from "./routes/auth.routes.js"
import spaceRouter from "./routes/space.routes.js";
import cookieParser from "cookie-parser";
import errorHandler from "./middleware/error.middleware.js";

const app=express();
app.use(express.json());
app.use(cookieParser());
app.use("/api/auth",authRouter);
app.use("/api/spaces", spaceRouter);
app.use(errorHandler);
export default app;