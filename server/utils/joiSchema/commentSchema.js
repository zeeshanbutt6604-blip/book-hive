import Joi from "joi";

const joiCreateCommentSchema = Joi.object({
  text: Joi.string().required().messages({
    "string.empty": "Comment text is required",
    "any.required": "Comment text is required",
  }),
});

const joiUpdateCommentSchema = Joi.object({
  text: Joi.string().required().messages({
    "string.empty": "Comment text is required",
    "any.required": "Comment text is required",
  }),
});

export { joiCreateCommentSchema, joiUpdateCommentSchema };

