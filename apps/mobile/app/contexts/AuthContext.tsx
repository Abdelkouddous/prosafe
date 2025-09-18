import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../services/api";

interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "user";
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchAndUpdateUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check for existing token on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      const userData = await AsyncStorage.getItem("userData");

      if (token && userData) {
        console.log("checkAuthStatus: Token and userData found.");
        try {
          const parsedUser = JSON.parse(userData);

          // Validate parsed user data
          if (
            !parsedUser.id ||
            !parsedUser.email ||
            !parsedUser.name ||
            !parsedUser.role
          ) {
            console.warn("Invalid stored user data, clearing...");
            await logout();
            return;
          }

          // Set the token in axios headers
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

          // Verify token with backend
          try {
            await fetchAndUpdateUser();
          } catch (error) {
            console.warn("Token verification failed, logging out...");
            await logout();
          }
        } catch (parseError) {
          console.error("Error parsing stored user data:", parseError);
          await logout();
        }
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
      await logout();
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAndUpdateUser = async () => {
    try {
      const response = await api.get("/auth/me");
      console.log("Raw API response:", response.data); // Debug line
      const userData = response.data;

      // Handle different response formats
      // let userInfo = userData;
      let userInfo = userData.user || userData.msg || userData;

      // Validate required fields (flexible for testing)
      if (!userInfo?.email) {
        throw new Error(
          `Invalid user data: Missing email. Full response: ${JSON.stringify(userData)}`
        );
      }
      if (userData.msg && typeof userData.msg === "object") {
        userInfo = userData.msg;
      }

      // Validate response data
      if (!userInfo || !userInfo.id || !userInfo.email) {
        throw new Error("Invalid user data received from server");
      }

      // Transform backend user format to frontend format
      const transformedUser: User = {
        id: userInfo.id,
        email: userInfo.email,
        name:
          userInfo.name ||
          `${userInfo.firstName || ""} ${userInfo.lastName || ""}`.trim() ||
          userInfo.email,
        role: userInfo.roles?.includes("admin") ? "admin" : "user",
      };

      setUser(transformedUser);
      setIsAuthenticated(true);
      console.log("fetchAndUpdateUser: User set and authenticated.");

      // Store user data in AsyncStorage
      await AsyncStorage.setItem("userData", JSON.stringify(transformedUser));
    } catch (error: any) {
      console.error("Error fetching user profile:", error);

      // If token is invalid (401), logout the user
      if (error.response?.status === 401) {
        console.warn("Token expired or invalid, logging out...");
        await logout();
      }
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);

      // Authenticate with backend
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      // Check if response exists and has data
      if (!response || !response.data) {
        throw new Error("No response received from server");
      }

      console.log("Backend response:", response.data);

      // Handle the actual backend response format
      const responseData = response.data;
      let authData = responseData;

      // Adjust this block to fit your real API structure
      if (responseData.msg && typeof responseData.msg === "object") {
        authData = responseData.msg;
      }

      // Extract token and user data
      const token = authData.access_token || authData.token;
      const userData = authData.user;

      // Defensive check
      if (!token || !userData) {
        throw new Error("Login failed: Missing token or user in response");
      }

      // Validate userData before storing
      if (!userData.id || !userData.email) {
        console.warn("Invalid user data received:", userData);
        throw new Error("Invalid user data received from server");
      }

      // Transform backend user format to frontend format
      const transformedUser: User = {
        id: userData.id,
        email: userData.email,
        name:
          userData.name ||
          `${userData.firstName || ""} ${userData.lastName || ""}`.trim() ||
          userData.email,
        role: userData.roles?.includes("admin") ? "admin" : "user",
      };

      // Store token and user data
      await AsyncStorage.setItem("authToken", token);
      await AsyncStorage.setItem("userData", JSON.stringify(transformedUser));

      // Set token in axios headers
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      setUser(transformedUser);
      setIsAuthenticated(true);
      console.log("Login: User authenticated successfully.");
    } catch (error: any) {
      console.error("Login error:", error);
      setIsAuthenticated(false);
      setUser(null);

      // Handle specific HTTP status codes
      if (error.response) {
        const status = error.response.status;
        const errorData = error.response.data;
        if (status === 401) {
          const errorMsg =
            errorData?.msg?.msg ||
            errorData?.msg ||
            errorData?.message ||
            "Invalid email or password";
          throw new Error(errorMsg);
        } else if (status === 400) {
          const errorMsg =
            errorData?.msg?.msg ||
            errorData?.msg ||
            errorData?.message ||
            "Invalid request";
          throw new Error(errorMsg);
        } else if (status >= 500) {
          throw new Error("Server error. Please try again later.");
        }
      }

      // Handle network errors
      if (
        error.code === "NETWORK_ERROR" ||
        error.message?.includes("Network Error") ||
        error.message?.includes("ECONNREFUSED") ||
        !error.response
      ) {
        throw new Error(
          "Unable to connect to server. Please check your internet connection."
        );
      }

      // For other errors, re-throw with a generic message
      throw new Error(
        error.response?.data?.message || "Login failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);

      // Clear stored data
      await AsyncStorage.multiRemove(["authToken", "userData"]);

      // Clear axios headers
      delete api.defaults.headers.common["Authorization"];

      // Reset state
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    fetchAndUpdateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
