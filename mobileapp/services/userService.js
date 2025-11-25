import api, { BASE_URL } from "./api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const AUTH_TOKEN_KEY = "@auth_token";

const getAuthHeaders = async () => {
  const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  return {
    "access-token": token || "",
  };
};

export const userService = {
  // Get user by ID (public profile)
  getUserById: async (userId) => {
    // Since we don't have a public user endpoint, we'll need to get posts by user
    // For now, we'll use the posts endpoint and filter
    // This is a limitation - ideally the backend should have a GET /api/users/:id endpoint
    const response = await api.get("/api/posts");
    const posts = response.data.posts || [];
    const userPost = posts.find((post) => post.userId._id === userId);
    
    if (userPost && userPost.userId) {
      return {
        success: true,
        user: userPost.userId,
      };
    }
    
    throw new Error("User not found");
  },

  // Get user posts
  getUserPosts: async (userId) => {
    const response = await api.get("/api/posts");
    const allPosts = response.data.posts || [];
    const userPosts = allPosts.filter((post) => post.userId._id === userId);
    
    return {
      success: true,
      posts: userPosts,
    };
  },

  // Update profile picture
  updateProfilePicture: async (imageUri, name) => {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    const formData = new FormData();

    // Extract filename from URI
    const filename = imageUri.split("/").pop() || "profile.jpg";
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : "image/jpeg";

    // Add profile picture file
    formData.append("profile_picture", {
      uri: imageUri,
      type: type,
      name: filename,
    });

    // Add name if provided
    if (name) {
      formData.append("name", name);
    }

    const response = await axios.put(`${BASE_URL}/api/auth/update-user-info`, formData, {
      headers: {
        "access-token": token || "",
        "Content-Type": "multipart/form-data",
      },
      timeout: 30000,
    });

    return response.data;
  },

  // Get file URL (helper method)
  getFileUrl: (filePath) => {
    if (!filePath) return null;
    if (filePath.startsWith("http")) return filePath;
    return `${BASE_URL}${filePath.startsWith("/") ? filePath : `/${filePath}`}`;
  },
};

