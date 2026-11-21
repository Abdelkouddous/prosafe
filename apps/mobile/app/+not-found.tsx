import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useLanguage } from "@/contexts/LanguageContext";

export default function NotFoundScreen() {
  const { t } = useLanguage();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("pageNotFound")}</Text>
      <TouchableOpacity style={styles.button} onPress={() => router.replace("/")}>
        <Text style={styles.buttonText}>{t("goHome")}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
    padding: 24,
  },
  title: { fontSize: 20, fontWeight: "600", color: "#1F2937", marginBottom: 16 },
  button: {
    backgroundColor: "#16A34A",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: { color: "#fff", fontWeight: "600" },
});
