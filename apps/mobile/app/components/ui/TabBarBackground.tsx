import { BlurView } from "expo-blur";
import React from "react";
import { StyleSheet } from "react-native";
import { useColorScheme } from "../../hooks/useColorScheme";

export default function TabBarBackground() {
  const colorScheme = useColorScheme();

  return (
    <BlurView
      tint={colorScheme === "dark" ? "dark" : "light"}
      intensity={100}
      style={StyleSheet.absoluteFill}
    />
  );
}
