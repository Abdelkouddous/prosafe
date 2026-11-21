import React from "react";
import { StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { RouteGuard } from "@/components/RouteGuard";

const GestureRoot = ({ children }: { children: React.ReactNode }) =>
  React.createElement(
    GestureHandlerRootView as any,
    { style: styles.container },
    children
  );

export default function RootLayout() {
  return (
    <GestureRoot>
      <LanguageProvider>
        <AuthProvider>
          <RouteGuard>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)/login" />
              <Stack.Screen name="(auth)/register" />
              <Stack.Screen name="dashboard" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="(extra)" />
              <Stack.Screen name="+not-found" />
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
