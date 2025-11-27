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
    if (!userId) {
      throw new Error("User ID is required");
    }
    
    try {
      const response = await api.get(`/api/auth/user/${userId}`);
      return response.data;
    } catch (error) {
      // Fallback: try to get user from posts if the endpoint fails
      const response = await api.get("/api/posts");
      const posts = response.data.posts || [];
      const userPost = posts.find((post) => {
        const postUserId = post.userId?._id || post.userId;
        return postUserId === userId;
      });
      
      if (userPost && userPost.userId) {
        return {
          success: true,
          user: userPost.userId,
        };
      }
      
      throw new Error(error.response?.data?.message || "User not found");
    }
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

  // Update profile (name and/or image)
  updateProfile: async (name, imageUri) => {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    const formData = new FormData();

    // Always add name if provided (even if empty, to ensure it's sent)
    // This ensures the name is always updated when the form is submitted
    if (name !== undefined && name !== null) {
      formData.append("name", String(name).trim());
    }

    // Add profile picture if provided
    if (imageUri) {
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
  // Constructs full HTTP URL for uploaded files
  // filePath format: "/uploads/filename.ext" or "uploads/filename.ext"
  getFileUrl: (filePath) => {
    if (!filePath) return null;
    
    // If already a full URL, return as is
    if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
      return filePath;
    }
    
    // Ensure path starts with /
    const normalizedPath = filePath.startsWith("/") ? filePath : `/${filePath}`;
    
    // Construct full URL: BASE_URL + path
    const fullUrl = `${BASE_URL}${normalizedPath}`;
    
    return fullUrl;
  },
};

