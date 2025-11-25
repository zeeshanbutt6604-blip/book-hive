import Joi from "joi";

const joiCreatePostSchema = Joi.object({
  title: Joi.string().required().messages({
    "string.empty": "Title is required",
    "any.required": "Title is required",
  }),
  description: Joi.string().required().messages({
    "string.empty": "Description is required",
    "any.required": "Description is required",
  }),
  bookType: Joi.string()
    .valid("pdf", "epub", "document", "image", "referred_link")
    .required()
    .messages({
      "any.only": "Book type must be one of: pdf, epub, document, image, referred_link",
      "any.required": "Book type is required",
    }),
  fileUrl: Joi.string().optional().allow(""),
  previewimage: Joi.string().optional().allow(""),
  linkUrl: Joi.string().optional().allow(""),
  linkImage: Joi.string().optional().allow(""),
}).custom((value, helpers) => {
  // If bookType is referred_link, linkUrl and linkImage are required
  if (value.bookType === "referred_link") {
    if (!value.linkUrl || value.linkUrl.trim() === "") {
      return helpers.error("any.custom", {
        message: "linkUrl is required when bookType is referred_link",
      });
    }
    if (!value.linkImage || value.linkImage.trim() === "") {
      return helpers.error("any.custom", {
        message: "linkImage is required when bookType is referred_link",
      });
    }
  }
  return value;
});

const joiUpdatePostSchema = Joi.object({
  title: Joi.string().optional(),
  description: Joi.string().optional(),
  bookType: Joi.string()
    .valid("pdf", "epub", "document", "image", "referred_link")
    .optional(),
  fileUrl: Joi.string().optional().allow(""),
  previewimage: Joi.string().optional().allow(""),
  linkUrl: Joi.string().optional().allow(""),
  linkImage: Joi.string().optional().allow(""),
});

export { joiCreatePostSchema, joiUpdatePostSchema };

