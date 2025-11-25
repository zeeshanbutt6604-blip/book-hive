import catchAsyncError from "../middleware/catchAsyncErrors.js";
import ErrorHandler from "../utils/errorHandler.js";
import {
  getCommentsByPostId,
  createComment,
  updateComment,
  deleteComment,
  isCommentOwner,
} from "../services/commentService.js";

// Get all comments for a post
export const getComments = catchAsyncError(async (req, res, next) => {
  try {
    const { postId } = req.params;
    const comments = await getCommentsByPostId(postId);

    res.status(200).json({
      success: true,
      count: comments.length,
      comments,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// Create or update comment
export const createOrUpdateComment = catchAsyncError(async (req, res, next) => {
  try {
    const { postId } = req.params;
    const userId = req.user?.id;
    const { text } = req.body;
    const { commentId } = req.query; // Optional: if commentId is provided, update instead of create

    if (commentId) {
      // Update existing comment
      const isOwner = await isCommentOwner(commentId, userId);
      if (!isOwner) {
        return next(
          new ErrorHandler("You are not authorized to update this comment", 403)
        );
      }

      const updatedComment = await updateComment(commentId, { text });

      res.status(200).json({
        success: true,
        message: "Comment updated successfully",
        comment: updatedComment,
      });
    } else {
      // Create new comment
      const commentData = {
        postId,
        userId,
        text,
      };

      const comment = await createComment(commentData);

      res.status(201).json({
        success: true,
        message: "Comment created successfully",
        comment,
      });
    }
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// Delete comment
export const deleteCommentHandler = catchAsyncError(async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const userId = req.user?.id;

    // Check if user is the owner
    const isOwner = await isCommentOwner(commentId, userId);
    if (!isOwner) {
      return next(
        new ErrorHandler("You are not authorized to delete this comment", 403)
      );
    }

    const deletedComment = await deleteComment(commentId);
    
    if (!deletedComment) {
      return next(new ErrorHandler("Comment not found", 404));
    }

    res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

