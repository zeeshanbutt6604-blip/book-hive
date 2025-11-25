import api from "./api";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AUTH_TOKEN_KEY = "@auth_token";

export const commentService = {
  // Get all comments for a post
  getComments: async (postId) => {
    const response = await api.get(`/api/posts/${postId}/comments`);
    return response.data;
  },

  // Create comment
  createComment: async (postId, text) => {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    const response = await api.post(
      `/api/posts/${postId}/comments`,
      { text },
      {
        headers: {
          "access-token": token || "",
        },
      }
    );

    return response.data;
  },

  // Update comment
  updateComment: async (postId, commentId, text) => {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    const response = await api.post(
      `/api/posts/${postId}/comments?commentId=${commentId}`,
      { text },
      {
        headers: {
          "access-token": token || "",
        },
      }
    );

    return response.data;
  },

  // Delete comment
  deleteComment: async (postId, commentId) => {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    const response = await api.delete(`/api/posts/${postId}/comments/${commentId}`, {
      headers: {
        "access-token": token || "",
      },
    });

    return response.data;
  },
};

