import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppTheme } from "@/contexts/AccessibilityContext";
import { TranslationKey } from "@/constants/Languages";

export function ComingSoon({
  titleKey,
  messageKey,
}: {
  titleKey: TranslationKey;
  messageKey: TranslationKey;
}) {
  const { t } = useLanguage();
  const { colors, fs } = useAppTheme();
  const back = () =>
    router.canGoBack() ? router.back() : router.replace("/(tabs)/home");
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TouchableOpacity onPress={back} style={styles.back} accessibilityLabel={t("back")}>
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>
      <View style={styles.center}>
        <Ionicons name="construct-outline" size={56} color={colors.warning} />
        <Text style={[styles.title, { color: colors.text, fontSize: fs(22) }]}>
          {t(titleKey)}
        </Text>
        <Text style={[styles.badge, { color: colors.warning, fontSize: fs(16) }]}>
          {t("comingSoon")}
        </Text>
        <Text style={[styles.message, { color: colors.textSecondary, fontSize: fs(14) }]}>
          {t(messageKey)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50, paddingHorizontal: 16 },
  back: { padding: 8, alignSelf: "flex-start" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, paddingBottom: 80 },
  title: { fontWeight: "700", marginTop: 8 },
  badge: { fontWeight: "700" },
  message: { textAlign: "center", paddingHorizontal: 24 },
});
