import Joi from "joi";

export const createTaskSchema = Joi.object({
  spaceId: Joi.string().required(),
  title: Joi.string().trim().min(1).max(100).required(),
  description: Joi.string().trim().allow("").optional(),
  priority: Joi.string().valid("LOW", "MEDIUM", "HIGH", "URGENT").default("MEDIUM"),
  deadline: Joi.date().iso().required(),
});

