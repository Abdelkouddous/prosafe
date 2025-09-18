import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../services/api"; // Assuming api.ts is in ../services
import { ToastAndroid } from "react-native";

interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  roles: string[];
  // Add other user properties as needed
}

interface AuthContextData {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>; // Updated parameter names
  logout: () => Promise<void>;
  fetchAndUpdateUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStorageData = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("authToken");
        const storedUser = await AsyncStorage.getItem("authUser");
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          // You might want to set the token in your api service header here if it's not already handled
          api.defaults.headers.Authorization = `Bearer ${storedToken}`;
        }
      } catch (error) {
        console.error("Failed to load auth data from storage", error);
      }
      setLoading(false);
    };
    loadStorageData();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await api.post("/auth/login", {
        email, // Changed from emailOrUsername
        password, // Changed from password_hash
      });
      const { access_token, user: userData } = response.data;

      setUser(userData);
      setToken(access_token);

      await AsyncStorage.setItem("authToken", access_token);
      await AsyncStorage.setItem("authUser", JSON.stringify(userData));
      api.defaults.headers.Authorization = `Bearer ${access_token}`;
    } catch (error) {
      console.error("Login failed", error);
      ToastAndroid.show("Login failed", ToastAndroid.SHORT);
      // Handle login errors (e.g., show a message to the user)
      throw error; // Re-throw to be caught by the calling component
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      setUser(null);
      setToken(null);
      await AsyncStorage.removeItem("authToken");
      await AsyncStorage.removeItem("authUser");
      delete api.defaults.headers.Authorization;
      // Potentially call a backend logout endpoint if you have one
      // await api.post('/auth/logout');
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAndUpdateUser = async () => {
    if (!token) return;
    setLoading(true);
    try {
      // Assuming you have an endpoint like /auth/me or /users/me to get current user details
      const response = await api.get("/auth/profile");
      const updatedUser = response.data;
      setUser(updatedUser);
      await AsyncStorage.setItem("authUser", JSON.stringify(updatedUser));
    } catch (error: any) {
      console.error("Failed to fetch user data", error);
      // If token is invalid (e.g. 401), logout the user
      if (error.response && error.response.status === 401) {
        await logout();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, logout, fetchAndUpdateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
