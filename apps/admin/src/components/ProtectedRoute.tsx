// src/components/ProtectedRoute.tsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

// Loading component for reusability
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-prosafe-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
);

// Component to redirect authenticated users away from login page
export const AuthRedirect = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading, isManager } = useAuth();
  const location = useLocation();

  if (isLoading) return <LoadingSpinner />;

  // Always redirect to dashboard if authenticated admin
  if (isAuthenticated && isManager) {
    return <Navigate to="/dashboard" replace />;
  }

  // For non-admin authenticated users trying to access login, redirect to home
  if (isAuthenticated && location.pathname === "/login") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <LoadingSpinner />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

// Admin and SST managers
export const AdminRoute = () => {
  const { isAuthenticated, isLoading, isManager } = useAuth();

  if (isLoading) return <LoadingSpinner />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isManager) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export const UserRoute = () => {
  const { isAuthenticated, isLoading, isManager } = useAuth();

  if (isLoading) return <LoadingSpinner />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirect admin users to dashboard
  if (isManager) {
    return <Navigate to="/dashboard" replace />;
  }

  // Only non-admin users can access these routes
  return <Outlet />;
};
