import Joi from "joi";

export const subscribePushSchema = Joi.object({
  subscription: Joi.object({
    endpoint: Joi.string()
      .uri({ scheme: ["https"] })
      .max(2048)
      .required()
      .messages({
        "string.uriCustomScheme": "Endpoint must be a valid HTTPS URL",
        "any.required": "Subscription endpoint is required",
      }),
    expirationTime: Joi.number().allow(null).optional(),
    keys: Joi.object({
      p256dh: Joi.string().trim().required().messages({
        "any.required": "p256dh key is required",
      }),
      auth: Joi.string().trim().required().messages({
        "any.required": "auth key is required",
      }),
    }).required(),
  }).required(),
  userAgent: Joi.string().max(500).allow("").optional(),
});

export const unsubscribePushSchema = Joi.object({
  endpoint: Joi.string()
    .uri({ scheme: ["https"] })
    .max(2048)
    .required()
    .messages({
      "string.uriCustomScheme": "Endpoint must be a valid HTTPS URL",
      "any.required": "Subscription endpoint is required",
    }),
});
