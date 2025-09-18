// src/components/ProtectedRoute.tsx
import { useEffect } from "react";
import { Navigate, Outlet, useNavigate, useLocation } from "react-router-dom";
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
  const { isAuthenticated, isLoading, isAdmin } = useAuth();
  const location = useLocation();

  if (isLoading) return <LoadingSpinner />;

  // Always redirect to dashboard if authenticated admin
  if (isAuthenticated && isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // For non-admin authenticated users trying to access login, redirect to home
  if (isAuthenticated && location.pathname === "/login") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export const ProtectedRoute = () => {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();

  if (isLoading) return <LoadingSpinner />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirect non-admin users away from protected routes
  // if (!isAdmin) {
  //   return <Navigate to="/" replace />;
  // }

  return <Outlet />;
};

export const AdminRoute = () => {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();

  if (isLoading) return <LoadingSpinner />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Always redirect non-admin users
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Only admin users can access these routes
  return <Outlet />;
};

export const UserRoute = () => {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();

  if (isLoading) return <LoadingSpinner />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirect admin users to dashboard
  if (isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // Only non-admin users can access these routes
  return <Outlet />;
};
