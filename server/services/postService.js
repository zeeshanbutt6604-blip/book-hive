import mongoose from "mongoose";
import Post from "../models/postModel.js";
import User from "../models/userModel.js";
import Comment from "../models/commentModel.js";

// Get all posts with user details
export const getAllPosts = async () => {
  const posts = await Post.find()
    .populate("userId", "name email profile_picture")
    .sort({ createdAt: -1 });
  
  // Calculate comment count for each post
  const postsWithCommentCount = await Promise.all(
    posts.map(async (post) => {
      const commentCount = await Comment.countDocuments({ postId: post._id });
      return {
        ...post.toObject(),
        commentCount,
      };
    })
  );
  
  return postsWithCommentCount;
};

// Get single post by ID
export const getPostById = async (postId) => {
  const post = await Post.findById(postId).populate(
    "userId",
    "name email profile_picture"
  );
  
  if (!post) {
    return null;
  }
  
  // Calculate comment count
  const commentCount = await Comment.countDocuments({ postId: post._id });
  
  return {
    ...post.toObject(),
    commentCount,
  };
};

// Create new post
export const createPost = async (postData) => {
  try {
    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      throw new Error("Database is not connected. Please check your MongoDB connection.");
    }

    // Validate required fields
    if (!postData.userId) {
      throw new Error("User ID is required");
    }
    if (!postData.title || postData.title.trim() === "") {
      throw new Error("Title is required");
    }
    if (!postData.description || postData.description.trim() === "") {
      throw new Error("Description is required");
    }
    if (!postData.bookType) {
      throw new Error("Book type is required");
    }

    console.log("Creating post with userId:", postData.userId);
    const post = new Post(postData);
    const savedPost = await post.save();
    
    if (!savedPost) {
      throw new Error("Failed to save post to database");
    }

    console.log("Post saved successfully with ID:", savedPost._id);

    const populatedPost = await Post.findById(savedPost._id).populate(
      "userId",
      "name email profile_picture"
    );
    
    // Add comment count (will be 0 for new posts)
    return {
      ...populatedPost.toObject(),
      commentCount: 0,
    };
  } catch (error) {
    console.error("Error creating post:", error);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message).join(", ");
      throw new Error(messages);
    }
    throw error;
  }
};

// Update post
export const updatePost = async (postId, updateData) => {
  const post = await Post.findByIdAndUpdate(postId, updateData, {
    new: true,
    runValidators: true,
  }).populate("userId", "name email profile_picture");
  return post;
};

// Delete post
export const deletePost = async (postId) => {
  const post = await Post.findByIdAndDelete(postId);
  return post;
};

// Check if user is post owner
export const isPostOwner = async (postId, userId) => {
  const post = await Post.findById(postId);
  if (!post) {
    return false;
  }
  return post.userId.toString() === userId.toString();
};

