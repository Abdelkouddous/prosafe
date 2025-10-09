import { Stack } from "expo-router";
import { AuthProvider } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { RouteGuard } from "./components/RouteGuard";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ToastAndroid,
} from "react-native";

import { API_BASE_URL } from "./services/api";
const GestureRoot = ({ children }: { children: React.ReactNode }) =>
  React.createElement(GestureHandlerRootView as any, { style: styles.container }, children);
export default function RootLayout() {
  // Test backend connection on component mount
  useEffect(() => {
    console.log("API_BASE_URL:", API_BASE_URL);
    console.log("Platform:", Platform.OS);

    const testBackendConnection = async () => {
      try {
        if (!API_BASE_URL) {
          console.log("No API_BASE_URL configured, using test accounts only");

          return;
        }

        const url = `${API_BASE_URL}/health-check`;
        console.log("Attempting to connect to:", url);

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Login: Backend connection successful!", data);

        // Show success toast
        if (Platform.OS === "android") {
          ToastAndroid.show(
            "Backend connected successfully!",
            ToastAndroid.SHORT
          );
        } else {
          Alert.alert("Success", "Backend connected successfully!");
        }
      } catch (error) {
        console.error("Login: Failed to connect to backend:", error);

        // Show error toast
        if (Platform.OS === "android") {
          ToastAndroid.show(
            "Using test accounts (backend offline)",
            ToastAndroid.LONG
          );
        } else {
          Alert.alert("Info", "Using test accounts (backend offline)");
        }
      }
    };

    testBackendConnection();
  }, []);
  return (
    <GestureRoot>
      <LanguageProvider>
        <AuthProvider>
          <RouteGuard>
            <Stack>
              <Stack.Screen
                name="(auth)/login"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="(auth)/register"
                options={{ headerShown: false }}
              />
              <Stack.Screen name="dashboard" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="(extra)" options={{ headerShown: false }} />
              <Stack.Screen
                name="+not-found"
                options={{ headerShown: false }}
              />
            </Stack>
          </RouteGuard>
        </AuthProvider>
      </LanguageProvider>
    </GestureRoot>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
