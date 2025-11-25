import catchAsyncError from "../middleware/catchAsyncErrors.js";
import ErrorHandler from "../utils/errorHandler.js";
import {
  getAllPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  isPostOwner,
} from "../services/postService.js";

// Get all posts
export const getPosts = catchAsyncError(async (req, res, next) => {
  try {
    const posts = await getAllPosts();

    res.status(200).json({
      success: true,
      count: posts.length,
      posts,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// Get single post
export const getPost = catchAsyncError(async (req, res, next) => {
  try {
    const { id } = req.params;
    const post = await getPostById(id);

    if (!post) {
      return next(new ErrorHandler("Post not found", 404));
    }

    res.status(200).json({
      success: true,
      post,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// Create post
export const createPostHandler = catchAsyncError(async (req, res, next) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return next(new ErrorHandler("User not authenticated", 401));
    }

    const { title, description, bookType, fileUrl, previewimage, linkUrl, linkImage } =
      req.body;

    // Validate required fields
    if (!title || title.trim() === "") {
      return next(new ErrorHandler("Title is required", 400));
    }
    if (!description || description.trim() === "") {
      return next(new ErrorHandler("Description is required", 400));
    }
    if (!bookType) {
      return next(new ErrorHandler("Book type is required", 400));
    }

    // Handle file uploads
    let fileUrlFinal = fileUrl || undefined;
    let previewimageFinal = previewimage || undefined;

    if (req.files) {
      if (req.files.file && req.files.file[0]) {
        fileUrlFinal = `/uploads/${req.files.file[0].filename}`;
      }
      if (req.files.previewimage && req.files.previewimage[0]) {
        previewimageFinal = `/uploads/${req.files.previewimage[0].filename}`;
      }
    }

    const postData = {
      userId,
      title: title.trim(),
      description: description.trim(),
      bookType,
      fileUrl: fileUrlFinal,
      previewimage: previewimageFinal,
      linkUrl: linkUrl || undefined,
      linkImage: linkImage || undefined,
    };

    console.log("Creating post with data:", { ...postData, userId: postData.userId });

    const post = await createPost(postData);

    if (!post) {
      return next(new ErrorHandler("Failed to create post", 500));
    }

    res.status(201).json({
      success: true,
      message: "Post created successfully",
      post,
    });
  } catch (error) {
    console.error("Error in createPostHandler:", error);
    return next(new ErrorHandler(error.message || "Failed to create post", 400));
  }
});

// Update post
export const updatePostHandler = catchAsyncError(async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // Check if post exists
    const post = await getPostById(id);
    if (!post) {
      return next(new ErrorHandler("Post not found", 404));
    }

    // Check if user is the owner
    const isOwner = await isPostOwner(id, userId);
    if (!isOwner) {
      return next(
        new ErrorHandler("You are not authorized to update this post", 403)
      );
    }

    const updateData = { ...req.body };

    // Handle file uploads
    if (req.files) {
      if (req.files.file) {
        updateData.fileUrl = `/uploads/${req.files.file[0].filename}`;
      }
      if (req.files.previewimage) {
        updateData.previewimage = `/uploads/${req.files.previewimage[0].filename}`;
      }
    }

    const updatedPost = await updatePost(id, updateData);

    res.status(200).json({
      success: true,
      message: "Post updated successfully",
      post: updatedPost,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// Delete post
export const deletePostHandler = catchAsyncError(async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // Check if post exists
    const post = await getPostById(id);
    if (!post) {
      return next(new ErrorHandler("Post not found", 404));
    }

    // Check if user is the owner
    const isOwner = await isPostOwner(id, userId);
    if (!isOwner) {
      return next(
        new ErrorHandler("You are not authorized to delete this post", 403)
      );
    }

    await deletePost(id);

    res.status(200).json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

