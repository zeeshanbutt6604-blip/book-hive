import api, { BASE_URL } from "./api";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AUTH_TOKEN_KEY = "@auth_token";

const getAuthHeaders = async () => {
  const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  return {
    "access-token": token || "",
  };
};

export const postService = {
  // Get all posts
  getAllPosts: async () => {
    const response = await api.get("/api/posts");
    return response.data;
  },

  // Get single post
  getPostById: async (postId) => {
    const response = await api.get(`/api/posts/${postId}`);
    return response.data;
  },

  // Create post
  createPost: async (postData, files = {}) => {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    const formData = new FormData();

    // Add text fields
    formData.append("title", postData.title);
    formData.append("description", postData.description);
    formData.append("bookType", postData.bookType);
    
    if (postData.linkUrl) {
      formData.append("linkUrl", postData.linkUrl);
    }
    if (postData.linkImage) {
      formData.append("linkImage", postData.linkImage);
    }

    // Add files if provided
    if (files.file) {
      formData.append("file", {
        uri: files.file.uri,
        type: files.file.type || "application/pdf",
        name: files.file.name || "file.pdf",
      });
    }

    if (files.previewimage) {
      formData.append("previewimage", {
        uri: files.previewimage.uri,
        type: files.previewimage.type || "image/jpeg",
        name: files.previewimage.name || "preview.jpg",
      });
    }

    const response = await api.post("/api/posts", formData, {
      headers: {
        "access-token": token || "",
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  },

  // Update post
  updatePost: async (postId, postData, files = {}) => {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    const formData = new FormData();

    // Add text fields
    if (postData.title) formData.append("title", postData.title);
    if (postData.description) formData.append("description", postData.description);
    if (postData.bookType) formData.append("bookType", postData.bookType);
    if (postData.linkUrl) formData.append("linkUrl", postData.linkUrl);
    if (postData.linkImage) formData.append("linkImage", postData.linkImage);

    // Add files if provided
    if (files.file) {
      formData.append("file", {
        uri: files.file.uri,
        type: files.file.type || "application/pdf",
        name: files.file.name || "file.pdf",
      });
    }

    if (files.previewimage) {
      formData.append("previewimage", {
        uri: files.previewimage.uri,
        type: files.previewimage.type || "image/jpeg",
        name: files.previewimage.name || "preview.jpg",
      });
    }

    const response = await api.put(`/api/posts/${postId}`, formData, {
      headers: {
        "access-token": token || "",
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  },

  // Delete post
  deletePost: async (postId) => {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    const response = await api.delete(`/api/posts/${postId}`, {
      headers: {
        "access-token": token || "",
      },
    });

    return response.data;
  },

  // Helper to get full file URL
  getFileUrl: (filePath) => {
    if (!filePath) return null;
    if (filePath.startsWith("http")) return filePath;
    return `${BASE_URL}${filePath}`;
  },
};

