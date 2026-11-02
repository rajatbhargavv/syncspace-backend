import { Request, Response } from "express";
import {
  deleteUser,
  getCurrentUser,
  getUserById,
  getUserProfile,
  updateUser,
  updateUserPlan,
} from "../services/user.service.js";
import AppError from "../utils/AppError.js";
import { IUpdateUser, UserPlan } from "../types/user.types.js";
import { NODE_ENV } from "../config/env.js";

export async function handleGetCurrentUser(req: Request, res: Response) {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError("Not authorized", 401);
  }
  const detail = await getCurrentUser(userId);
  return res.status(200).json({
    user: detail,
    message: "User fetched successfully",
  });
}

export async function handleUpdateUser(req: Request, res: Response) {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError("Not authorized", 401);
  }
  const details: IUpdateUser = req.body;
  const updatedUser = await updateUser(userId, details);
  return res.status(200).json({
    user: updatedUser,
    message: "User updated successfully",
  });
}

export async function handleGetUserById(req: Request, res: Response) {
  const id = req.params?.id;
  if (!id || typeof id !== "string") {
    throw new AppError("Valid Id must be provided", 400);
  }
  const result = await getUserById(id);
  return res.status(200).json({
    user: result,
    message: "User fetched successfully",
  });
}

export async function handleGetUserProfile(req: Request, res: Response) {
  const id = req.params?.id;
  if (!id || typeof id !== "string") {
    throw new AppError("Valid Id must be provided", 400);
  }
  const profile = await getUserProfile(id);
  return res.status(200).json({
    message: "User profile fetched successfully",
    profile,
  });
}

export async function handleUpdateUserPlan(req: Request, res: Response) {
  if (NODE_ENV === "production") {
    throw new AppError("Not found", 404);
  }
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError("Not authorized", 401);
  }
  const plan = req.body.plan as UserPlan;
  if (!plan || (plan !== "FREE" && plan !== "PRO")) {
    throw new AppError("Plan must be either 'FREE' or 'PRO'", 400);
  }
  const user = await updateUserPlan(userId, plan);
  return res.status(200).json({
    message: "User plan updated successfully (dev-only toggle)",
    user,
  });
}

export async function handleDeletetUser(req: Request, res: Response) {
  const id = req.user?.id;
  if (!id) {
    throw new AppError("Not authorized", 401);
  }
  await deleteUser(id);
  return res.status(200).json({
    message: "User deleted successfully",
  });
}
