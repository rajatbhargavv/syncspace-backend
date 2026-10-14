import express from "express";
import { userSchema,loginSchema} from "../validators/user.validator.js";
import validate from "../middleware/validation.middleware.js";
import { handleRegisterUser, handleUserLogin } from "../controllers/auth.controller.js";
import asyncHandler from "../utils/asyncHandler.js";
const router=express.Router();
router.post("/register",validate(userSchema),asyncHandler(handleRegisterUser))
router.post("/login",validate(loginSchema),asyncHandler(handleUserLogin))
export default router;