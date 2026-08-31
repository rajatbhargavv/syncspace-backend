import Joi from "joi";
const userSchema=Joi.object({
    name:Joi.string().trim().min(3).max(20).pattern(/^[A-Za-z ]+$/).required(),
    email:Joi.string().lowercase().email().required(),
    password:Joi.string().min(7).pattern(/^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[@#$%^&*!]).*$/).required()
})
export default userSchema;