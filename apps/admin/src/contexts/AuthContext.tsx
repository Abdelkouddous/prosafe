import { createContext, useContext, useState, useEffect } from "react";
import api from "@/services/api";
import { setToken, getToken, removeToken } from "@/lib/auth";
import { useToast } from "@/components/ui/use-toast";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: string[]; // Changed from 'role: string' to 'roles: string[]'
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>(null!);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        if (getToken()) {
          const { data } = await api.get("/auth/me");
          setUser(data.user); // Changed from setUser(data) to setUser(data.user)
          console.log("User loaded from token:", data.user);
        }
      } catch (error) {
        console.error("Error loading user:", error);
        removeToken();
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);
  const { toast } = useToast();

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post("/auth/login", { email, password });
      const data = response.data;

      // Check if we have an access token
      if (data.access_token) {
        // Store token first
        setToken(data.access_token);
        
        // Add a small delay to ensure token is stored
        await new Promise(resolve => setTimeout(resolve, 100));

        let userData;
        // If we have user data in the response, use it directly
        if (data.user) {
          setUser(data.user);
          userData = data.user;
          console.log("User data from login response:", userData);
        } else {
          // Otherwise, fetch user data with the new token
          try {
            console.log("Fetching user data from /auth/me...");
            const userResponse = await api.get("/auth/me");
            setUser(userResponse.data.user);
            userData = userResponse.data.user;
            console.log("User data from /auth/me:", userData);
          } catch (meError) {
            console.error("Error fetching user data:", meError);
            // If /auth/me fails, we can still proceed with basic user info from login
            if (data.email) {
              const basicUser = {
                email: data.email,
                firstName: data.firstName || '',
                lastName: data.lastName || '',
                roles: data.roles || ['standard'],
                id: data.id || ''
              };
              setUser(basicUser);
              userData = basicUser;
            }
          }
        }

        toast({
          title: "Success",
          description: "You have successfully logged in",
          duration: 3000,
        });

        // Return the data with user info for further processing
        return { ...data, user: userData };
      } else {
        throw new Error("No access token received");
      }
    } catch (error) {
      console.error("Login error:", error);

      // Handle specific error messages from the backend
      if (error.response && error.response.data && error.response.data.msg) {
        toast({
          title: "Login Failed",
          description: error.response.data.msg,
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

      // Return a rejected promise with the error
      return Promise.reject(error);
    }
  };

  const logout = () => {
    removeToken();
    setUser(null);
    // Navigation removed from here - handle it in your components instead
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    isLoading,
    isAdmin: user?.roles?.includes("admin"), // Changed from 'user?.role?.includes("admin")'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
