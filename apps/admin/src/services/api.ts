// src/services/api.ts
import axios from "axios";
import { getToken, removeToken } from "@/lib/auth";

export const AUTH_EXPIRED_EVENT = "prosafe:auth-expired";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 60000,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const requestUrl = String(error.config?.url || "");
      const isAuthEndpoint =
        requestUrl.includes("/auth/login") ||
        requestUrl.includes("/auth/firebase") ||
        requestUrl.includes("/auth/demo");
      if (!isAuthEndpoint) {
        removeToken();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
