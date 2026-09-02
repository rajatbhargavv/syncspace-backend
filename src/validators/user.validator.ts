import Joi from "joi";
export const userSchema=Joi.object({
    name:Joi.string().trim().min(3).max(20).pattern(/^[A-Za-z ]+$/).required(),
    email:Joi.string().lowercase().email().required(),
    password:Joi.string().min(7).pattern(/^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[@#$%^&*!]).*$/).required()
})
export const loginSchema=Joi.object({
    email:Joi.string().lowercase().email().required(),
    password:Joi.string().required()
})
