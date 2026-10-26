import Joi from "joi";

const entityId = Joi.string()
    .trim()
    .min(1)
    .max(200);

const priority = Joi.string()
    .valid("LOW", "MEDIUM", "HIGH", "URGENT");

const progressStatus = Joi.string()
    .valid("TODO", "IN_PROGRESS", "COMPLETED");

const assigneeStatus = Joi.string()
    .valid("TODO", "IN_PROGRESS", "DONE");


const assigneeSchema = Joi.object({
    userId: entityId.required(),
    status: assigneeStatus.optional()
}).unknown(false);

const assigneeInputSchema = Joi.object({
    userId: entityId.required()
}).unknown(false);


const taskSchema = Joi.object({
    spaceId: entityId.required(),

    title: Joi.string()
        .trim()
        .min(3)
        .max(150)
        .required(),

    description: Joi.string()
        .trim()
        .max(2000)
        .allow("")
        .optional(),

    priority: priority.default("MEDIUM"),

    deadline: Joi.date()
        .iso()
        .required(),

    assignees: Joi.array()
        .items(assigneeInputSchema)
        .min(1)
        .unique("userId")
        .required()
})
    .unknown(false);


const updateTaskSchema = Joi.object({
    title: Joi.string()
        .trim()
        .min(3)
        .max(150)
        .optional(),

    description: Joi.string()
        .trim()
        .max(2000)
        .allow("")
        .optional(),

    priority: priority.optional(),

    deadline: Joi.date()
        .iso()
        .optional()
})
    .min(1)
    .unknown(false);


const assignTaskSchema = Joi.object({
    assignees: Joi.array()
        .items(assigneeInputSchema)
        .min(1)
        .unique("userId")
        .required()
})
    .unknown(false);


const updateAssigneeStatusSchema = Joi.object({
    status: assigneeStatus.required()
})
    .unknown(false);


const taskQuerySchema = Joi.object({
    spaceId: entityId.optional(),

    priority: priority.optional(),

    progressStatus: progressStatus.optional(),

    lifecycleStatus: Joi.string()
        .valid("ACTIVE", "DELETED")
        .optional(),

    assignedTo: entityId.optional(),

    createdBy: entityId.optional(),

    search: Joi.string()
        .trim()
        .max(100)
        .optional(),

    page: Joi.number()
        .integer()
        .min(1)
        .default(1),

    limit: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .default(20),

    sortBy: Joi.string()
        .valid("createdAt", "updatedAt", "deadline", "priority")
        .default("createdAt"),

    sortOrder: Joi.string()
        .valid("asc", "desc")
        .default("desc")
})
    .unknown(false);


export {
    taskSchema,
    updateTaskSchema,
    assignTaskSchema,
    updateAssigneeStatusSchema,
    taskQuerySchema,
    assigneeSchema
};
