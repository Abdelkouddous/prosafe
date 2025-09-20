// src/services/api.ts
import axios from "axios";
import { getToken, removeToken } from "@/lib/auth";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  timeout: 10000, // Add a timeout
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`Sending ${config.method?.toUpperCase()} to ${config.url} with token: ${token.substring(0, 20)}...`);
    } else {
      console.log(`Sending ${config.method?.toUpperCase()} to ${config.url} WITHOUT token`);
    }
    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log("Response:", response.config.url, response.status);
    return response;
  },
  (error) => {
    if (axios.isCancel(error)) {
      console.log("Request canceled:", error.message);
    } else if (error.code === "ECONNABORTED") {
      console.error("Timeout:", error.config.url);
    } else if (error.response) {
      // Server responded with error status
      console.error("API Error:", error.response.status, error.response.data);

      if (error.response.status === 401) {
        console.log("Unauthorized access, redirecting to home page");
        removeToken();
        // Use window.location for a full page refresh to ensure clean state
        window.location.href = "/";
      }
    } else if (error.request) {
      // No response received
      console.error("No response:", error.request);
    } else {
      // Request setup error
      console.error("Request setup error:", error.message);
    }

    return Promise.reject(error);
  }
);

export default api;
