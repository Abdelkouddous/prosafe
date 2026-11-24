import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { signInWithPopup, signOut } from "firebase/auth";
import { disconnectSocket } from "@/services/socket";
import api, { AUTH_EXPIRED_EVENT } from "@/services/api";
import { setToken, getToken, removeToken } from "@/lib/auth";
import { firebaseAuth, googleAuthProvider } from "@/lib/firebase";
import { useToast } from "@/components/ui/use-toast";
import { isDemoAccount, type DemoPersonaRole } from "@/lib/workspaceFeatures";

export type Role = "admin" | "sst_manager" | "employee" | "pending";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];
  department?: string | null;
  zone?: string | null;
  phone?: string | null;
  avatar?: string;
}

interface AuthResponse {
  access_token: string;
  user?: User;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<AuthResponse>;
  loginWithGoogle: () => Promise<AuthResponse>;
  loginDemo: (role?: DemoPersonaRole) => Promise<AuthResponse>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isDemoSession: boolean;
}

const AuthContext = createContext<AuthContextType>(null!);

function extractErrorMessage(error: unknown, fallback: string): string {
  const e = error as {
    response?: { data?: { msg?: string | { msg?: string }; message?: string; error?: string } };
    message?: string;
  };
  const rawMsg = e?.response?.data?.msg;
  const candidate =
    typeof rawMsg === "string"
      ? rawMsg
      : rawMsg?.msg ?? e?.response?.data?.message ?? e?.response?.data?.error;
  return typeof candidate === "string" && candidate ? candidate : fallback;
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const clearSession = useCallback(() => {
    disconnectSocket();
    removeToken();
    setUser(null);
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      try {
        if (getToken()) {
          const { data } = await api.get("/auth/me");
          setUser(data.user);
        } else {
          removeToken();
        }
      } catch {
        clearSession();
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();

    const onExpired = () => {
      clearSession();
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
  }, [clearSession]);

  const completeSession = async (data: AuthResponse): Promise<AuthResponse> => {
    if (!data.access_token) {
      throw new Error("No access token received");
    }
    setToken(data.access_token);

    let userData = data.user;
    if (!userData) {
      try {
        userData = (await api.get("/auth/me")).data.user;
      } catch (meError) {
        clearSession();
        throw meError;
      }
    }
    setUser(userData);
    toast({
      title: "Success",
      description: "You have successfully logged in",
      duration: 3000,
    });
    return { ...data, user: userData };
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post<AuthResponse>("/auth/login", { email, password });
      return await completeSession(response.data);
    } catch (error) {
      toast({
        title: "Login Failed",
        description: extractErrorMessage(error, "Invalid email or password."),
        variant: "destructive",
        duration: 5000,
      });
      return Promise.reject(error);
    }
  };

  const loginWithGoogle = async () => {
    try {
      const credential = await signInWithPopup(firebaseAuth, googleAuthProvider);
      const idToken = await credential.user.getIdToken();
      const response = await api.post<AuthResponse>("/auth/firebase", { idToken });
      return await completeSession(response.data);
    } catch (error) {
      toast({
        title: "Google Sign-In Failed",
        description: extractErrorMessage(
          error,
          "Unable to complete Google authentication. Please try again."
        ),
        variant: "destructive",
        duration: 5000,
      });
      return Promise.reject(error);
    }
  };

  const loginDemo = async (role: DemoPersonaRole = "admin") => {
    const attemptDemo = () => api.post<AuthResponse>("/auth/demo", { role });
    try {
      let response;
      try {
        response = await attemptDemo();
      } catch (firstErr) {
        const status = (firstErr as { response?: { status?: number } })?.response?.status;
        const shouldRetry = !status || status >= 502;
        if (!shouldRetry) throw firstErr;
        await new Promise((resolve) => setTimeout(resolve, 2000));
        response = await attemptDemo();
      }
      return await completeSession(response.data);
    } catch (error) {
      toast({
        title: "Demo Access Failed",
        description: extractErrorMessage(error, "Unable to launch demo session right now."),
        variant: "destructive",
        duration: 5000,
      });
      return Promise.reject(error);
    }
  };

  const logout = () => {
    clearSession();
    void signOut(firebaseAuth).catch(() => {
      /* ignore firebase sign-out if not signed in via firebase */
    });
  };

  const isAdmin = !!user?.roles?.includes("admin");
  const isManager = isAdmin || !!user?.roles?.includes("sst_manager");
  const isDemoSession = isDemoAccount(user?.email);

  const value: AuthContextType = {
    user,
    login,
    loginWithGoogle,
    loginDemo,
    logout,
    isAuthenticated: !!user,
    isLoading,
    isAdmin,
    isManager,
    isDemoSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
