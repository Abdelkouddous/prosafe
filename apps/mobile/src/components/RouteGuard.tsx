import { useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return; // Don't redirect while loading

    const root = segments[0] as string | undefined;
    const inAuthGroup = root === "(auth)";
    const isManager = user?.role === "admin" || user?.role === "sst_manager";

    if (!isAuthenticated) {
      if (!inAuthGroup) {
        router.replace("/(auth)/login");
      }
      return;
    }

    if (inAuthGroup) {
      router.replace(isManager ? "/dashboard" : "/(tabs)/menu");
    } else if (root === "dashboard" && !isManager) {
      // Only admin / sst_manager may open the manager dashboard
      router.replace("/(tabs)/menu");
    }
  }, [isAuthenticated, isLoading, segments, user, router]);

  return <>{children}</>;
}
