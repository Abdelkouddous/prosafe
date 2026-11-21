import { useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return; // Don't redirect while loading

    const inAuthGroup = segments[0] === "(auth)";
    const inTabsGroup = segments[0] === "(tabs)";

    if (!isAuthenticated) {
      // Redirect to login if not authenticated and not already in auth group
      if (!inAuthGroup) {
        router.replace("/(auth)/login");
      }
    } else {
      // User is authenticated
      if (inAuthGroup) {
        // If in auth group, redirect to appropriate dashboard based on role
        if (user?.role === "admin") {
          router.replace("/dashboard"); // Admin goes to admin dashboard
        } else {
          router.replace("/(tabs)/menu"); // Regular user goes to main menu
        }
      } else if (inTabsGroup && user) {
        // Check if user is trying to access a route they shouldn't
        const currentTabRoute = segments.length > 1 ? segments[1] : null;

        // Role-based access control
        if (user.role === "admin") {
        }
        // Admin can access all routes, no restrictions

        // } else {
        //   // Regular users cannot access admin-specific routes
        //   if (currentTabRoute === "profile") {
        //     router.replace("/(tabs)/formations");
        //   }
        // }
      }
    }
  }, [isAuthenticated, isLoading, segments, user]);

  return <>{children}</>;
}
