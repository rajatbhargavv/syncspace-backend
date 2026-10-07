import express from "express"
import authRouter from "./routes/auth.routes.js"
import spaceRouter from "./routes/space.routes.js";

const app=express();
app.use(express.json());
app.use("/api/auth",authRouter);
app.use("/api/spaces", spaceRouter);
export default app;