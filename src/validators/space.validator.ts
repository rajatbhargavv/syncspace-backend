import Joi from "joi";

const spaceSchema = Joi.object({
    name:Joi
            .string()
            .trim()
            .min(3)
            .max(50)
            .required(),
    description: Joi
                    .string()
                    .trim()
                    .max(500)
                    .allow("")
                    .optional()
})

const updateSpaceSchema=Joi.object({
    name:        Joi
                    .string()
                    .trim()
                    .min(3)
                    .max(50)
                    .optional(),
    description: Joi
                    .string()
                    .trim()
                    .max(500)
                    .allow("")
                    .optional()
})

export default {spaceSchema,updateSpaceSchema}