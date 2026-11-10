import express from "express";
import { userSchema } from "../validators/user.validator.js";
import { loginSchema } from "../validators/auth.validator.js";
import validate from "../middleware/validation.middleware.js";
import {
  handleRegisterUser,
  handleUserLogin,
  handleRefreshToken,
  handleLogout,
} from "../controllers/auth.controller.js";
import asyncHandler from "../utils/asyncHandler.js";

const router = express.Router();

router.post("/register", validate(userSchema), asyncHandler(handleRegisterUser));
router.post("/login", validate(loginSchema), asyncHandler(handleUserLogin));
router.post("/refresh", asyncHandler(handleRefreshToken));
router.post("/logout", asyncHandler(handleLogout));

export default router;


