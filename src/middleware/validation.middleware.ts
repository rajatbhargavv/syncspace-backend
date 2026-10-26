import { NextFunction, Request, Response } from "express";
import AppError from "../utils/AppError.js";
import Joi from "joi";

type ValidationSource = "body" | "query";

export default function validate(
    schema: Joi.ObjectSchema,
    source: ValidationSource = "body"
) {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.validate(req[source]);

        if (result.error) {
            return next(new AppError(result.error.message, 400));
        }

        req[source] = result.value;
        next();
    };
}