import { joiCreatePostSchema, joiUpdatePostSchema } from "../../utils/joiSchema/postSchema.js";
import validationResponse from "../../utils/validationResponse.js";

// Create post form validation
const createPostValidation = (req, _, next) => {
  const { error } = joiCreatePostSchema.validate(req.body);
  validationResponse(error, next);
};

// Update post form validation
const updatePostValidation = (req, _, next) => {
  const { error } = joiUpdatePostSchema.validate(req.body);
  validationResponse(error, next);
};

export { createPostValidation, updatePostValidation };

