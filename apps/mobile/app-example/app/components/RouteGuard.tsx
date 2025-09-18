import React, { useEffect } from "react";
import { useRouter, useSegments } from "expo-router";
import { useAuth } from "../contexts/AuthContext";

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) {
      return; // Wait until authentication status is determined
    }

    const inAuthGroup = segments[0] === "(auth)";
    const inTabsGroup = segments[0] === "(tabs)";

    if (!user && !inAuthGroup) {
      // If the user is not authenticated and not in the auth group, redirect to login.
      router.replace("/login");
    } else if (user) {
      const isAdmin = user.roles.includes("admin");
      const currentTabRoute = inTabsGroup && segments.length > 1 ? segments[1] : null;

      if (inAuthGroup) {
        // If the user is authenticated and in the auth group, redirect to the appropriate dashboard.
        if (isAdmin) {
          router.replace("/(tabs)/admin-dashboard");
        } else {
          router.replace("/(tabs)/camera");
        }
      } else if (inTabsGroup) {
        // Role-based access control within the (tabs) group
        if (isAdmin && currentTabRoute !== "admin-dashboard") {
          // Admin should only access the admin dashboard
          router.replace("/(tabs)/admin-dashboard");
        } else if (!isAdmin && currentTabRoute !== "camera") {
          // Non-admin users should only access the camera screen
          router.replace("/(tabs)/camera");
        }
      }
    }
  }, [user, loading, segments, router]);

  return <>{children}</>;
}