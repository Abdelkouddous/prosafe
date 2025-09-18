import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Platform } from "react-native";

// Platform-specific API URL logic
const getApiUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  return envUrl;
  // if (envUrl) {
  //   return envUrl;
  // }

  // // Fallback logic for development
  // if (__DEV__) {
  //   if (Platform.OS === "android") {
  //     return "http://10.0.2.2:3000/api"; // Android emulator
  //   } else {
  //     return "http://localhost:3000/api"; // iOS simulator
  //   }
  // }

  // return "https://api.example.com"; // Production fallback
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

// You can add a response interceptor here to handle global errors, e.g., 401 for logout

export default api;

// Example function to fetch messages for the logged-in user
export const fetchMyMessages = async () => {
  try {
    const response = await api.get("/messages");
    return response.data;
  } catch (error) {
    console.error("Error fetching my messages:", error);
    // You might want to check for error.response.status === 401 here
    // and trigger logout if the token is invalid.
    throw error;
  }
};

// Keep other specific fetch functions if needed, or create them as below:
// export const fetchSomeOtherData = async () => { ... };
