import React, { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "./contexts/AuthContext";

export default function Index() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return; // Wait for auth check to complete

    if (!isAuthenticated) {
      // User is not authenticated, redirect to login
      router.replace("/(auth)/login");
    } else {
      // User is authenticated, redirect to appropriate dashboard based on role
      if (user?.role === "admin") {
        router.replace("/(tabs)/menu"); // Admin goes to messages
      } else {
        router.replace("/(tabs)/menu"); // Regular user goes to camera
      }
    }
  }, [isAuthenticated, isLoading, user, router]);

  // Show loading spinner while checking authentication
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f5f5f5",
      }}
    >
      <ActivityIndicator size="large" color="#007AFF" />
    </View>
  );
}
