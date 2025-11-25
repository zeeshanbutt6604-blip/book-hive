import Comment from "../models/commentModel.js";
import Post from "../models/postModel.js";
import ErrorHandler from "../utils/errorHandler.js";

// Get all comments for a post
export const getCommentsByPostId = async (postId) => {
  const comments = await Comment.find({ postId })
    .populate("userId", "name email profile_picture")
    .sort({ createdAt: -1 });
  return comments;
};

// Create new comment
export const createComment = async (commentData) => {
  try {
    // Validate required fields
    if (!commentData.postId) {
      throw new ErrorHandler("Post ID is required", 400);
    }
    if (!commentData.userId) {
      throw new ErrorHandler("User ID is required", 400);
    }
    if (!commentData.text || commentData.text.trim() === "") {
      throw new ErrorHandler("Comment text is required", 400);
    }

    // Check if post exists
    const post = await Post.findById(commentData.postId);
    if (!post) {
      throw new ErrorHandler("Post not found", 404);
    }

    const comment = new Comment({
      postId: commentData.postId,
      userId: commentData.userId,
      text: commentData.text.trim(),
    });

    const savedComment = await comment.save();
    
    if (!savedComment) {
      throw new ErrorHandler("Failed to save comment to database", 500);
    }

    return await Comment.findById(savedComment._id).populate(
      "userId",
      "name email profile_picture"
    );
  } catch (error) {
    console.error("Error creating comment:", error);
    throw error;
  }
};

// Update comment
export const updateComment = async (commentId, updateData) => {
  const comment = await Comment.findByIdAndUpdate(commentId, updateData, {
    new: true,
    runValidators: true,
  }).populate("userId", "name email profile_picture");
  return comment;
};

// Delete comment
export const deleteComment = async (commentId) => {
  const comment = await Comment.findByIdAndDelete(commentId);
  return comment;
};

// Check if user is comment owner
export const isCommentOwner = async (commentId, userId) => {
  const comment = await Comment.findById(commentId);
  if (!comment) {
    return false;
  }
  return comment.userId.toString() === userId.toString();
};

