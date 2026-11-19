import {
  registerUser,
  userLogin,
  refreshAccessToken,
  logoutUser,
} from "../services/auth.service.js";
import { IUser } from "../types/user.types.js";
import { ILogin } from "../types/auth.types.js";
import { NextFunction, Request, Response } from "express";
import { NODE_ENV, SECRET_KEY_REFRESH } from "../config/env.js";
import Jwt from "jsonwebtoken";

function getCookieBaseOptions(req: Request) {
  const origin = req.headers.origin;
  const isHttpsOrigin = Boolean(origin && origin.startsWith("https://"));
  const isRender = Boolean(
    process.env.RENDER === "true" ||
    process.env.RENDER_SERVICE_ID ||
    process.env.RENDER_EXTERNAL_URL
  );
  const isProd =
    NODE_ENV === "production" ||
    process.env.NODE_ENV === "production" ||
    process.env.NODE_ENV !== "development";

  const isCrossSite = isHttpsOrigin || isRender || isProd;

  return {
    httpOnly: true,
    sameSite: (isCrossSite ? "none" : "lax") as "none" | "lax",
    secure: isCrossSite,
  };
}

export async function handleRegisterUser(req: Request, res: Response, next: NextFunction) {
  const user: IUser = req.body;
  const result = await registerUser(user);
  return res.status(201).json({
    message: "Successfully created",
    user: { name: result.name, email: result.email },
  });
}

export async function handleUserLogin(req: Request, res: Response, next: NextFunction) {
  const user: ILogin = req.body;
  const { accessToken, refreshToken } = await userLogin(user);
  const cookieBaseOptions = getCookieBaseOptions(req);

  // Short-lived access token cookie (15 mins)
  res.cookie("accessToken", accessToken, {
    ...cookieBaseOptions,
    maxAge: 15 * 60 * 1000,
  });

  // Token cookie for backward compatibility
  res.cookie("token", accessToken, {
    ...cookieBaseOptions,
    maxAge: 24 * 60 * 60 * 1000,
  });

  // Long-lived refresh token cookie (24 hours)
  res.cookie("refreshToken", refreshToken, {
    ...cookieBaseOptions,
    maxAge: 24 * 60 * 60 * 1000,
  });

  return res.status(200).json({
    message: "Successfully logged in",
    accessToken,
  });
}


export async function handleRefreshToken(req: Request, res: Response, next: NextFunction) {
  const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

  const { accessToken, refreshToken } = await refreshAccessToken(incomingRefreshToken);
  const cookieBaseOptions = getCookieBaseOptions(req);

  res.cookie("accessToken", accessToken, {
    ...cookieBaseOptions,
    maxAge: 15 * 60 * 1000,
  });

  res.cookie("token", accessToken, {
    ...cookieBaseOptions,
    maxAge: 24 * 60 * 60 * 1000,
  });

  res.cookie("refreshToken", refreshToken, {
    ...cookieBaseOptions,
    maxAge: 24 * 60 * 60 * 1000,
  });

  return res.status(200).json({
    message: "Token refreshed successfully",
    accessToken,
  });
}

export async function handleLogout(req: Request, res: Response, next: NextFunction) {
  const userId = req.user?.id;
  const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

  if (userId) {
    await logoutUser(userId);
  } else if (incomingRefreshToken) {
    try {
      const decoded = Jwt.verify(incomingRefreshToken, SECRET_KEY_REFRESH) as { id: string };
      if (decoded?.id) {
        await logoutUser(decoded.id);
      }
    } catch {
      // Token expired or invalid; proceed with clearing cookies
    }
  }

  const cookieBaseOptions = getCookieBaseOptions(req);
  res.clearCookie("accessToken", cookieBaseOptions);
  res.clearCookie("refreshToken", cookieBaseOptions);
  res.clearCookie("token", cookieBaseOptions);

  return res.status(200).json({
    message: "Logged out successfully",
  });
}

