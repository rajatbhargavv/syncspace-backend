import Joi from "joi";

export const subTaskValidator = Joi.object({
  taskId: Joi
                .string()
                .hex()
                .length(24)
                .required(),

  title: Joi
                .string()
                .trim()
                .required(),

  description: Joi
                .string()
                .trim()
                .optional(),

  assigneeId: Joi
                .string()
                .hex()
                .length(24)
                .required(),
  priority: Joi
                .string()
                .valid("LOW", "MEDIUM", "HIGH", "URGENT")
                .default("MEDIUM"),

  deadline: Joi
                .date()
                .required(),

  status: Joi
                .string()
                .valid("TODO", "IN_PROGRESS", "DONE")
                .default("TODO"),

  lifecycleStatus: Joi
                .string()
                .valid("ACTIVE", "DELETED")
                .default("ACTIVE"),
});