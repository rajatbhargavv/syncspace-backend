import Joi from "joi";

export const createSubtaskValidator = Joi.object({
  title: Joi.string().trim().required(),
  description: Joi.string().trim().allow("").optional(),
  assigneeId: Joi.string().required(),
  priority: Joi.string()
    .valid("LOW", "MEDIUM", "HIGH", "URGENT")
    .default("MEDIUM")
    .optional(),
  deadline: Joi.date().iso().required(),
});

export const updateSubtaskValidator = Joi.object({
  title: Joi.string().trim().optional(),
  description: Joi.string().trim().allow("").optional(),
  assigneeId: Joi.string().optional(),
  priority: Joi.string().valid("LOW", "MEDIUM", "HIGH", "URGENT").optional(),
  deadline: Joi.date().iso().optional(),
  status: Joi.string().valid("TODO", "IN_PROGRESS", "DONE").optional(),
}).min(1);

export const subTaskValidator = createSubtaskValidator;
