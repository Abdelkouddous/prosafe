import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Platform } from "react-native";

// Platform-specific API URL logic
const getApiUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) {
    return envUrl;
  }

  // Fallback logic for development
  if (__DEV__) {
    if (Platform.OS === "android") {
      return "http://10.0.2.2:3000/api"; // Android emulator
    } else {
      return "http://localhost:3000/api"; // iOS simulator
    }
  }

  return "https://api.example.com"; // Production fallback
};

export const API_BASE_URL = getApiUrl();

// connect frontend to backend
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
});

// Add a request interceptor to include the token in headers
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle global errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle 401 errors globally
    if (error.response?.status === 401) {
      // Clear stored data
      await AsyncStorage.multiRemove(["authToken", "userData"]);
      // Clear axios headers
      delete api.defaults.headers.common["Authorization"];
      // You might want to trigger navigation to login screen here
    }
    return Promise.reject(error);
  }
);

export default api;

// Example function to fetch messages for the logged-in user
export const fetchMyMessages = async () => {
  try {
    const response = await api.get("/messages");
    return response.data;
  } catch (error) {
    console.error("Error fetching my messages:", error);
    throw error;
  }
};

export const fetchMyIncidents = async () => {
  try {
    const response = await api.get("/incidents");
    return response.data;
  } catch (error) {
    console.error("Error fetching my incidents:", error);
    throw error;
  }
};

export const fetchMyUser = async () => {
  try {
    const response = await api.get("/auth/me");
    return response.data;
  } catch (error) {
    console.error("error fetching my user acc", error);
    throw error;
  }
};

// TODO- FORMATIONS LIST FROM BACKEND
export const fetchMyTrainings = async () => {
  try {
    const response = await api.get("/trainings");
    return response.data;
  } catch (error) {
    console.error("error fetching my trainings", error);
    throw error;
  }
};
