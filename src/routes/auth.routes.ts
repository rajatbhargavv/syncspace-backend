import express from "express";
import { userSchema,loginSchema} from "../validators/user.validator.js";
import validate from "../middleware/validation.middleware.js";
import { handleregisterUser ,handleuserLogin} from "../controllers/user.controller.js";
import asyncHandler from "../utils/asyncHandler.js";
const router=express.Router();
router.post("/register",validate(userSchema),asyncHandler(handleregisterUser))
router.post("/login",validate(loginSchema),asyncHandler(handleuserLogin))
export default router;