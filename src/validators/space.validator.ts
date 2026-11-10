import Joi from "joi";

const themeSchema = Joi.object({
    preset: Joi.string().valid("HEARTH", "NEON_GRID", "IVORY_INK", "ORBIT").optional(),
    mode: Joi.string().valid("light", "dark").optional()
});

const spaceSchema = Joi.object({
    name: Joi.string()
        .trim()
        .min(3)
        .max(50)
        .required(),
    description: Joi.string()
        .trim()
        .max(500)
        .allow("")
        .optional(),
    kind: Joi.string()
        .valid("OUR_HOME", "BUILDERS_CIRCLE", "STUDIO", "MY_CORNER", "CUSTOM")
        .optional(),
    theme: themeSchema.optional(),
    visibility: Joi.string()
        .valid("PRIVATE", "UNLISTED", "PUBLIC")
        .optional(),
    joinPolicy: Joi.string()
        .valid("INVITE_ONLY", "REQUEST", "OPEN")
        .optional(),
    spaceType: Joi.string()
        .valid("Personal", "Shared")
        .optional()
});

const updateSpaceSchema = Joi.object({
    name: Joi.string()
        .trim()
        .min(3)
        .max(50)
        .optional(),
    description: Joi.string()
        .trim()
        .max(500)
        .allow("")
        .optional(),
    status: Joi.string()
        .valid("Active", "Inactive")
        .optional(),
    kind: Joi.string()
        .valid("OUR_HOME", "BUILDERS_CIRCLE", "STUDIO", "MY_CORNER", "CUSTOM")
        .optional(),
    theme: themeSchema.optional(),
    visibility: Joi.string()
        .valid("PRIVATE", "UNLISTED", "PUBLIC")
        .optional(),
    joinPolicy: Joi.string()
        .valid("INVITE_ONLY", "REQUEST", "OPEN")
        .optional()
});

export { spaceSchema, updateSpaceSchema };
