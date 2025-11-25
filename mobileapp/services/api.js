import axios from "axios";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Get server base URI from config or environment variable
const getBaseUrl = () => {
  // Try expo config first
  if (Constants.expoConfig?.extra?.serverBaseUri) {
    return Constants.expoConfig.extra.serverBaseUri;
  }
  // Try environment variable
  if (process.env.EXPO_PUBLIC_SERVER_BASE_URI) {
    return process.env.EXPO_PUBLIC_SERVER_BASE_URI;
  }
  // Fallback to default
  return "http://192.168.18.207:5274";
};

const BASE_URL = getBaseUrl();

// Log the base URL for debugging (remove in production)
console.log("API Base URL:", BASE_URL);

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Get token from AsyncStorage or Redux store
    // For now, we'll handle this in individual service calls
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized - try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem("@refresh_token");
        if (!refreshToken) {
          // No refresh token, redirect to login
          throw new Error("Session expired. Please login again.");
        }

        // Try to refresh the token
        const refreshResponse = await axios.get(`${BASE_URL}/api/auth/refresh-token`, {
          headers: {
            "refresh-token": refreshToken,
          },
        });

        if (refreshResponse.data.success && refreshResponse.data.accessToken) {
          // Store new access token
          await AsyncStorage.setItem("@auth_token", refreshResponse.data.accessToken);
          
          // Retry original request with new token
          originalRequest.headers["access-token"] = refreshResponse.data.accessToken;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens and reject
        await AsyncStorage.removeItem("@auth_token");
        await AsyncStorage.removeItem("@refresh_token");
        await AsyncStorage.removeItem("@user_data");
        return Promise.reject({
          message: "Session expired. Please login again.",
          status: 401,
        });
      }
    }

    if (error.response) {
      // Server responded with error status
      console.error("API Error Response:", error.response.status, error.response.data);
      return Promise.reject({
        message: error.response.data?.message || "An error occurred",
        status: error.response.status,
        data: error.response.data,
      });
    } else if (error.request) {
      // Request made but no response
      console.error("API Network Error:", error.message, "URL:", BASE_URL);
      return Promise.reject({
        message: `Network error. Please check your connection and ensure the server is running at ${BASE_URL}`,
        status: 0,
        originalError: error.message,
      });
    } else {
      // Something else happened
      console.error("API Request Setup Error:", error.message);
      return Promise.reject({
        message: error.message || "An unexpected error occurred",
        status: 0,
      });
    }
  }
);

export default api;
export { BASE_URL };

