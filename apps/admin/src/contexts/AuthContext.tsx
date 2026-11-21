import { createContext, useContext, useState, useEffect } from "react";
import { disconnectSocket } from "@/services/socket";
import api from "@/services/api";
import { setToken, getToken, removeToken } from "@/lib/auth";
import { useToast } from "@/components/ui/use-toast";

export type Role = "admin" | "sst_manager" | "employee" | "pending";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];
  password?: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<any>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  isManager: boolean;
}

const AuthContext = createContext<AuthContextType>(null!);

const clearAuth = () => {
  removeToken();
  localStorage.removeItem("user_data");
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadUser = async () => {
      try {
        if (getToken()) {
          // Always verify with the server; cached user_data is never trusted.
          const { data } = await api.get("/auth/me");
          setUser(data.user);
          localStorage.setItem("user_data", JSON.stringify(data.user));
        } else {
          clearAuth();
        }
      } catch {
        clearAuth();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post("/auth/login", { email, password });
      const data = response.data;

      if (!data.access_token) {
        throw new Error("No access token received");
      }
      setToken(data.access_token);

      let userData = data.user;
      if (!userData) {
        try {
          userData = (await api.get("/auth/me")).data.user;
        } catch (meError) {
          clearAuth();
          setUser(null);
          throw meError;
        }
      }
      setUser(userData);
      localStorage.setItem("user_data", JSON.stringify(userData));

      toast({
        title: "Success",
        description: "You have successfully logged in",
        duration: 3000,
      });

      return { ...data, user: userData };
    } catch (error: any) {
      const rawMsg = error.response?.data?.msg;
      const loginMsg =
        typeof rawMsg === "string" ? rawMsg : rawMsg?.msg ?? error.response?.data?.message;
      if (typeof loginMsg === "string" && loginMsg) {
        toast({
          title: "Login Failed",
          description: loginMsg,
          variant: "destructive",
          duration: 5000,
        });
      } else {
        toast({
          title: "Error",
          description: "Something went wrong during login",
          variant: "destructive",
          duration: 5000,
        });
      }
      return Promise.reject(error);
    }
  };

  const logout = () => {
    disconnectSocket();
    clearAuth();
    setUser(null);
  };

  const isAdmin = !!user?.roles?.includes("admin");
  const isManager = isAdmin || !!user?.roles?.includes("sst_manager");

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    isLoading,
    isAdmin,
    isManager,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
