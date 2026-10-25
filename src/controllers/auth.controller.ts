import { registerUser, userLogin } from "../services/auth.service.js";
import { IUser } from "../types/user.types.js";
import { ILogin } from "../types/auth.types.js";
import { NextFunction, Request, Response } from "express";
import { NODE_ENV } from "../config/env.js";

export async function handleRegisterUser(req: Request, res: Response, next: NextFunction) {
    const user: IUser = req.body;
    const result = await registerUser(user);
    return res.status(201).json({
        message: "Successfully created",
        user: { name: result.name, email: result.email }
    });
}

export async function handleUserLogin(req: Request, res: Response, next: NextFunction) {
    const user: ILogin = req.body;
    const { accessToken, refreshToken } = await userLogin(user);

    // Short-lived access token cookie (15 mins)
    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        sameSite: "strict",
        maxAge: 15 * 60 * 1000,
        secure: NODE_ENV === "production"
    });

    // Token cookie for backward compatibility with existing tests
    res.cookie("token", accessToken, {
        httpOnly: true,
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000,
        secure: NODE_ENV === "production"
    });

    // Long-lived refresh token cookie (24 hours)
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000,
        secure: NODE_ENV === "production"
    });

    return res.status(200).json({
        message: "Successfully logged in",
        accessToken
    });
}
