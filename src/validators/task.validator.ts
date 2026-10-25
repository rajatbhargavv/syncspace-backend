import Joi from "joi";

export const createTaskSchema = Joi.object({
  spaceId: Joi.string().required(),
  title: Joi.string().trim().min(1).max(100).required(),
  description: Joi.string().trim().allow("").optional(),
  priority: Joi.string().valid("LOW", "MEDIUM", "HIGH", "URGENT").default("MEDIUM"),
  deadline: Joi.date().iso().required(),
});

export const updateTaskSchema = Joi.object({
  title: Joi.string().trim().min(1).max(100).optional(),
  description: Joi.string().trim().allow("").optional(),
  priority: Joi.string().valid("LOW", "MEDIUM", "HIGH", "URGENT").optional(),
  deadline: Joi.date().iso().optional(),
  progressStatus: Joi.string().valid("TODO", "IN_PROGRESS", "COMPLETED").optional(),
}).min(1);

export const addAssigneeSchema = Joi.object({
  userId: Joi.string().required(),
});

export const updateAssigneeStatusSchema = Joi.object({
  status: Joi.string().valid("TODO", "IN_PROGRESS", "DONE").required(),
});
