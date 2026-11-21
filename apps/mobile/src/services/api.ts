import axios from "axios";
import { Platform } from "react-native";
import { storage } from "./storage";

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

  return "https://api.example.com/api"; // Production fallback (set EXPO_PUBLIC_API_URL)
};

export const API_BASE_URL = getApiUrl();

// Listeners notified when the API answers 401 (session expired / invalid)
type UnauthorizedListener = () => void;
const unauthorizedListeners = new Set<UnauthorizedListener>();
export const onUnauthorized = (listener: UnauthorizedListener) => {
  unauthorizedListeners.add(listener);
  return () => {
    unauthorizedListeners.delete(listener);
  };
};

// connect frontend to backend
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Add a request interceptor to include the token in headers
api.interceptors.request.use(
  async (config) => {
    const token = await storage.getToken();
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
    // (the login endpoint itself returns 401 for bad credentials: ignore it)
    const url: string = error.config?.url ?? "";
    if (error.response?.status === 401 && !url.includes("/auth/login")) {
      await storage.clear();
      delete api.defaults.headers.common["Authorization"];
      unauthorizedListeners.forEach((l) => l());
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

export const fetchMyRewardsSummary = async () => {
  try {
    const response = await api.get("/rewards/me/summary");
    return response.data;
  } catch (error) {
    console.error("Error fetching rewards summary:", error);
    throw error;
  }
};
