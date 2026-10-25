import express from "express";
import asyncHandler from "../utils/asyncHandler.js";
import { handleDeletetUser, handleGetCurrentUser, handleGetUserById, handleUpdateUser } from "../controllers/user.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import validate from "../middleware/validation.middleware.js";
import { updateUserSchema } from "../validators/user.validator.js";
const userRouter=express.Router();
userRouter.use(requireAuth)
userRouter.get("/me",asyncHandler(handleGetCurrentUser))
userRouter.delete("/deactivate",asyncHandler(handleDeletetUser))
userRouter.patch("/update",validate(updateUserSchema),asyncHandler(handleUpdateUser))
userRouter.get("/:id",asyncHandler(handleGetUserById));
export default userRouter;