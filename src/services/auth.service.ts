import { randomUUID } from "crypto";
import User from "../models/User.model.js";
import AppError from "../utils/AppError.js";
import { IUser } from "../types/user.types.js";
import { ILogin, IAuthTokens } from "../types/auth.types.js";
import bcrypt from "bcrypt";
import Jwt from "jsonwebtoken";
import { SECRET_KEY_ACCESS, SECRET_KEY_REFRESH } from "../config/env.js";

export async function registerUser(user: IUser) {
  const exists = await User.findOne({ email: user.email });
  if (exists) {
    throw new AppError("Already registered using this email", 409);
  }
  const hashedPassword = await bcrypt.hash(user.password, 10);
  const newuser = await User.create({
    name: user.name,
    email: user.email,
    password: hashedPassword,
  });
  return newuser;
}

export async function userLogin(user: ILogin): Promise<IAuthTokens> {
  const exists = await User.findOne({ email: user.email }).select("+password");
  if (!exists) {
    throw new AppError("Invalid email or Password", 401);
  }
  if (exists.isDeleted) {
    throw new AppError("Account has been deactivated", 401);
  }
  const match = await bcrypt.compare(user.password, exists.password);
  if (!match) {
    throw new AppError("Invalid email or Password", 401);
  }
  const accessToken = Jwt.sign({ id: exists._id }, SECRET_KEY_ACCESS, {
    expiresIn: "15m",
  });
  const refreshToken = Jwt.sign({ id: exists._id, jti: randomUUID() }, SECRET_KEY_REFRESH, {
    expiresIn: "1d",
  });
  exists.refreshToken = refreshToken;
  await exists.save();
  return { accessToken, refreshToken };
}

export async function refreshAccessToken(incomingRefreshToken: string): Promise<IAuthTokens> {
  if (!incomingRefreshToken) {
    throw new AppError("Refresh token is required", 401);
  }

  let decoded: { id: string };
  try {
    decoded = Jwt.verify(incomingRefreshToken, SECRET_KEY_REFRESH) as { id: string };
  } catch {
    throw new AppError("Invalid or expired refresh token", 401);
  }

  const user = await User.findById(decoded.id).select("+refreshToken");
  if (!user || user.isDeleted) {
    throw new AppError("User not found or account deactivated", 401);
  }

  // Ensure stored token matches incoming token (prevents use of revoked or old tokens)
  if (!user.refreshToken || user.refreshToken !== incomingRefreshToken) {
    throw new AppError("Invalid or revoked refresh token", 401);
  }

  // Rotate tokens: generate fresh access token and fresh refresh token with unique jti
  const newAccessToken = Jwt.sign({ id: user._id }, SECRET_KEY_ACCESS, {
    expiresIn: "15m",
  });
  const newRefreshToken = Jwt.sign({ id: user._id, jti: randomUUID() }, SECRET_KEY_REFRESH, {
    expiresIn: "1d",
  });

  user.refreshToken = newRefreshToken;
  await user.save();

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

export async function logoutUser(userId: string): Promise<void> {
  if (!userId) {
    throw new AppError("UserId is required", 400);
  }
  await User.findByIdAndUpdate(userId, { $unset: { refreshToken: 1 } });
}
