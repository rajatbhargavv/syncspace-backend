import express from "express";
import { userSchema,loginSchema} from "../validators/user.validator";
import validate from "../middleware/validation.middleware";
import { handleregisterUser ,handleuserLogin} from "../controllers/user.controller";
import asyncHandler from "../utils/asyncHandler";
const router=express.Router();
router.post("/register",validate(userSchema),asyncHandler(handleregisterUser))
router.post("/login",validate(loginSchema),asyncHandler(handleuserLogin))
export default router;