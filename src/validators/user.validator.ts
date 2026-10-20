import Joi from "joi";
export const userSchema=Joi.object({
    name:    Joi
                .string()
                .trim()
                .min(3)
                .max(20)
                .pattern(/^[A-Za-z ]+$/)
                .required(),
    email:   Joi
                .string()
                .lowercase()
                .email()
                .required(),
    password:Joi
                .string()
                .min(7)
                .pattern(/^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[@#$%^&*!]).*$/)
                .required()
})
export const updateUserSchema=Joi.object({
     name:    Joi
                .string()
                .trim()
                .min(3)
                .max(20)
                .pattern(/^[A-Za-z ]+$/)
                .optional(),
    email:   Joi
                .string()
                .lowercase()
                .email()
                .optional(),
    password:Joi
                .string()
                .min(7)
                .pattern(/^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[@#$%^&*!]).*$/)
                .optional()
}).min(1)