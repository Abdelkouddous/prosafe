import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";
import { useColorScheme } from "@/hooks/useColorScheme";
import { AuthProvider } from "./contexts/AuthContext";
import { API_BASE_URL } from "./services/api";
import { ToastAndroid } from "react-native";
import RouteGuard from "./components/RouteGuard";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    const testBackendConnection = async () => {
      if (!API_BASE_URL) {
        console.error("Mobile: EXPO_PUBLIC_API_URL is not defined!");
        return;
      }
      try {
        console.log(
          `Mobile: Attempting to connect to backend at ${API_BASE_URL}/health-check`
        );
        const response = await fetch(`${API_BASE_URL}/health-check`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Mobile: Backend connection successful!", data);
        ToastAndroid.show("Backend connection successful!", ToastAndroid.SHORT);
      } catch (error) {
        console.error("Mobile: Failed to connect to backend:", error);
        ToastAndroid.show("Backend connection failed!", ToastAndroid.TOP);
      }
    };

    testBackendConnection();
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <RouteGuard>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="login" />
            <Stack.Screen name="camera" />
            <Stack.Screen name="admin-dashboard" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="+not-found" />
          </Stack>
        </RouteGuard>
      </ThemeProvider>
    </AuthProvider>
  );
}
