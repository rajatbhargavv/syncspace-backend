import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import AppError from "../utils/AppError.js";
import { SECRET_KEY_ACCESS } from "../config/env.js";

interface JwtPayload {
  id: string;
}

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    let token = req.cookies?.accessToken || req.cookies?.token;
    if (!token && req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }
    if (!token) {
      throw new AppError("Not Authorized", 401);
    }
    const decoded = jwt.verify(token, SECRET_KEY_ACCESS) as JwtPayload;
    if (!decoded || !decoded.id) {
      throw new AppError("Not Authorized", 401);
    }
    req.user = { id: decoded.id };
    next();
  } catch (err: any) {
    if (err instanceof AppError) {
      return next(err);
    }
    if (err?.name === "TokenExpiredError") {
      return next(new AppError("Token expired", 401));
    }
    return next(new AppError("Not Authorized", 401));
  }
}
