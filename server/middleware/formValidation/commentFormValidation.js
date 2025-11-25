import {
  joiCreateCommentSchema,
  joiUpdateCommentSchema,
} from "../../utils/joiSchema/commentSchema.js";
import validationResponse from "../../utils/validationResponse.js";

// Create comment form validation
const createCommentValidation = (req, _, next) => {
  const { error } = joiCreateCommentSchema.validate(req.body);
  validationResponse(error, next);
};

// Update comment form validation
const updateCommentValidation = (req, _, next) => {
  const { error } = joiUpdateCommentSchema.validate(req.body);
  validationResponse(error, next);
};

export { createCommentValidation, updateCommentValidation };

