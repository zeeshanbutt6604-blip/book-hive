import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { postService } from "@/services/postService";
import { commentService } from "@/services/commentService";
import { authService } from "@/services/authService";
import { userService } from "@/services/userService";

export interface Post {
  _id: string;
  id?: string; // For backward compatibility
  userId: {
    _id: string;
    name: string;
    email: string;
    profile_picture?: string;
  } | string; // Can be string (userId) or populated object
  title: string;
  description: string;
  bookType: "pdf" | "epub" | "document" | "image" | "referred_link";
  fileUrl?: string;
  previewimage?: string;
  linkUrl?: string;
  linkImage?: string;
  createdAt: string;
  commentCount?: number;
  // For backward compatibility with old Post type
  userName?: string;
  userAvatar?: string;
  pdfUrl?: string;
  pdfName?: string;
  referredLink?: string;
}

export interface Comment {
  _id: string;
  id?: string; // For backward compatibility
  postId: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    profile_picture?: string;
  } | string;
  text: string;
  createdAt: string;
  // For backward compatibility
  userName?: string;
  userAvatar?: string;
}

interface PostsContextType {
  posts: Post[];
  loading: boolean;
  error: string | null;
  addPost: (post: Post) => void;
  deletePost: (postId: string) => Promise<void>;
  refreshPosts: () => Promise<void>;
  getUserPosts: (userId?: string) => Post[];
  getPostById: (postId: string) => Post | undefined;
}

const PostsContext = createContext<PostsContextType | undefined>(undefined);

export const PostsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Transform API post to app post format
  const transformPost = (apiPost: any): Post => {
    // Handle null/undefined userId
    let userId: any;
    if (apiPost.userId && typeof apiPost.userId === "object" && apiPost.userId !== null) {
      userId = apiPost.userId;
    } else if (apiPost.userId) {
      userId = { _id: apiPost.userId };
    } else {
      userId = { _id: null, name: "Unknown", email: "" };
    }
    
    // Convert profile picture to full URL if it exists
    const profilePicture = userId && typeof userId === "object" && userId.profile_picture 
      ? userId.profile_picture 
      : undefined;
    const userAvatar = profilePicture ? userService.getFileUrl(profilePicture) : undefined;
    
    return {
      ...apiPost,
      id: apiPost._id, // For backward compatibility
      userId: userId,
      userName: (userId && typeof userId === "object" && userId.name) ? userId.name : "Unknown",
      userAvatar: userAvatar,
      previewImage: apiPost.previewimage ? postService.getFileUrl(apiPost.previewimage) : undefined,
      pdfUrl: apiPost.fileUrl ? postService.getFileUrl(apiPost.fileUrl) : undefined,
      referredLink: apiPost.linkUrl,
      commentCount: apiPost.commentCount || 0,
      createdAt: apiPost.createdAt ? new Date(apiPost.createdAt).toLocaleString() : "Unknown",
    };
  };

  // Fetch all posts
  const refreshPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await postService.getAllPosts();
      
      if (response.success) {
        const transformedPosts = response.posts.map(transformPost);
        setPosts(transformedPosts);
      } else {
        setError("Failed to fetch posts");
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch posts");
      console.error("Error fetching posts:", err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    refreshPosts();
  }, []);

  const addPost = (post: Post) => {
    setPosts((prevPosts) => [post, ...prevPosts]);
  };

  const deletePost = async (postId: string) => {
    try {
      await postService.deletePost(postId);
      setPosts((prevPosts) => prevPosts.filter((post) => post._id !== postId && post.id !== postId));
    } catch (err: any) {
      throw new Error(err.message || "Failed to delete post");
    }
  };

  const getUserPosts = (userId?: string) => {
    if (!userId) {
      // Return current user's posts
      return posts.filter((post) => {
        const postUserId = typeof post.userId === "object" ? post.userId._id : post.userId;
        // We'll need to get current user ID from auth service
        return false; // Will be handled in Profile screen
      });
    }
    return posts.filter((post) => {
      const postUserId = typeof post.userId === "object" ? post.userId._id : post.userId;
      return postUserId === userId;
    });
  };

  const getPostById = (postId: string) => {
    return posts.find((post) => post._id === postId || post.id === postId);
  };

  return (
    <PostsContext.Provider
      value={{
        posts,
        loading,
        error,
        addPost,
        deletePost,
        refreshPosts,
        getUserPosts,
        getPostById,
      }}
    >
      {children}
    </PostsContext.Provider>
  );
};

export const usePosts = () => {
  const context = useContext(PostsContext);
  if (!context) {
    throw new Error("usePosts must be used within a PostsProvider");
  }
  return context;
};
