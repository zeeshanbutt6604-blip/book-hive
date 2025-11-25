import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    title: {
      type: String,
      required: [true, "Title is required"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    bookType: {
      type: String,
      enum: ["pdf", "epub", "document", "image", "referred_link"],
      required: [true, "Book type is required"],
    },
    fileUrl: {
      type: String,
    },
    previewimage: {
      type: String,
    },
    linkUrl: {
      type: String,
    },
    linkImage: {
      type: String,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Validate that linkUrl and linkImage are provided when bookType is referred_link
postSchema.pre("save", function (next) {
  if (this.isNew && this.bookType === "referred_link") {
    if (!this.linkUrl || this.linkUrl.trim() === "") {
      const error = new Error("linkUrl is required when bookType is referred_link");
      return next(error);
    }
    if (!this.linkImage || this.linkImage.trim() === "") {
      const error = new Error("linkImage is required when bookType is referred_link");
      return next(error);
    }
  }
  next();
});

const Post = mongoose.model("Post", postSchema);

export default Post;

