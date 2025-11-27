import api from "./api";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AUTH_TOKEN_KEY = "@auth_token";
const REFRESH_TOKEN_KEY = "@refresh_token";
const USER_DATA_KEY = "@user_data";

export const authService = {
  // Register user
  register: async (userData) => {
    try {
      const response = await api.post("/api/auth/register", userData);
      return response.data;
    } catch (error) {
      // Re-throw with formatted error
      throw {
        message: error.message || "Registration failed",
        response: error.response || null,
        code: error.code || null,
      };
    }
  },

  // Activate user
  activateUser: async (token) => {
    const response = await api.post(`/api/auth/activate-user/${token}`);
    return response.data;
  },

  // Login
  login: async (email, password) => {
    try {
      const response = await api.post("/api/auth/login", { email, password });
      
      if (response.data.success && response.data.accessToken) {
        // Store tokens and user data
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, response.data.accessToken);
        if (response.data.refreshToken) {
          await AsyncStorage.setItem(REFRESH_TOKEN_KEY, response.data.refreshToken);
        }
        if (response.data.user) {
          await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(response.data.user));
        }
      }
      
      return response.data;
    } catch (error) {
      // Re-throw with formatted error
      throw {
        message: error.message || "Login failed",
        response: error.response || null,
        code: error.code || null,
      };
    }
  },

  // Refresh access token
  refreshToken: async () => {
    const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      throw new Error("No refresh token found");
    }
    
    const response = await api.get("/api/auth/refresh-token", {
      headers: {
        "refresh-token": refreshToken,
      },
    });
    
    if (response.data.success && response.data.accessToken) {
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, response.data.accessToken);
      // Refresh token typically doesn't change, but update if provided
      if (response.data.refreshToken) {
        await AsyncStorage.setItem(REFRESH_TOKEN_KEY, response.data.refreshToken);
      }
      return response.data;
    }
    
    throw new Error("Failed to refresh token");
  },

  // Logout
  logout: async () => {
    try {
      await api.get("/api/auth/logout", {
        headers: {
          "access-token": await AsyncStorage.getItem(AUTH_TOKEN_KEY),
        },
      });
    } catch (error) {
      console.log("Logout error:", error);
    } finally {
      // Clear local storage
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
      await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
      await AsyncStorage.removeItem(USER_DATA_KEY);
    }
  },

  // Get current user info
  getCurrentUser: async () => {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      throw new Error("No token found");
    }
    
    const response = await api.get("/api/auth/me", {
      headers: {
        "access-token": token,
      },
    });
    
    return response.data;
  },

  // Update user info
  updateUserInfo: async (userData) => {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    const response = await api.put("/api/auth/update-user-info", userData, {
      headers: {
        "access-token": token,
      },
    });
    
    if (response.data.success && response.data.user) {
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(response.data.user));
    }
    
    return response.data;
  },

  // Get stored token
  getToken: async () => {
    return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  },

  // Get stored user data
  getUserData: async () => {
    const userData = await AsyncStorage.getItem(USER_DATA_KEY);
    return userData ? JSON.parse(userData) : null;
  },

  // Check if user is authenticated
  isAuthenticated: async () => {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    return !!token;
  },
};

