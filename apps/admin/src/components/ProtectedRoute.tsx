// src/components/ProtectedRoute.tsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getHomeRoute } from "@/lib/routeAccess";

// Loading component for reusability
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-screen bg-background text-foreground">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-prosafe-600 mx-auto"></div>
      <p className="mt-4 text-muted-foreground">Loading...</p>
    </div>
  </div>
);

// Route guard for guest-only marketing, landing, and auth pages.
// Authenticated users are strictly routed back into their role-appropriate workspace.
export const GuestOnlyRoute = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return <LoadingSpinner />;

  if (isAuthenticated) {
    return <Navigate to={getHomeRoute(user?.roles)} replace />;
  }

  return <Outlet />;
};

// Wrapper component to redirect authenticated users away from guest-only screens
export const AuthRedirect = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return <LoadingSpinner />;

  if (isAuthenticated) {
    return <Navigate to={getHomeRoute(user?.roles)} replace />;
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
  const { isAuthenticated, isLoading, isManager, user } = useAuth();

  if (isLoading) return <LoadingSpinner />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isManager) {
    return <Navigate to={getHomeRoute(user?.roles)} replace />;
  }

  return <Outlet />;
};

export const UserRoute = () => {
  const { isAuthenticated, isLoading, isManager, user } = useAuth();

  if (isLoading) return <LoadingSpinner />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirect admin/manager users to their dashboard
  if (isManager) {
    return <Navigate to={getHomeRoute(user?.roles)} replace />;
  }

  // Only non-admin users can access these routes
  return <Outlet />;
};
