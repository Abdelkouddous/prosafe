import React, { useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { router } from "expo-router";

export default function LogoutScreen() {
  const { logout } = useAuth();

  useEffect(() => {
    const doLogout = async () => {
      try {
        await logout();
        router.replace("/(auth)/login");
      } catch (e) {
        console.error("Logout error", e);
      }
    };

    doLogout();
  }, [logout]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.text}>Signing you out…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  text: {
    marginTop: 12,
    color: "#374151",
    fontSize: 16,
    fontWeight: "500",
  },
});