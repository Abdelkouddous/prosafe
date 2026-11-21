import { Tabs, router } from "expo-router";
import React from "react";
import { Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { HapticTab } from "@/components/HapticTab";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppTheme } from "@/contexts/AccessibilityContext";

type TabIconProps = { color: string; focused: boolean };

function PlusButton() {
  const { t } = useLanguage();
  const { colors } = useAppTheme();
  return (
    <View style={styles.plusWrapper} pointerEvents="box-none">
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={t("tabReportIncident")}
        onPress={() => router.push("/incident/new")}
        style={[styles.plus, { backgroundColor: colors.danger }]}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={34} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

export default function TabLayout() {
  const { t } = useLanguage();
  const { colors, fs } = useAppTheme();

  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarLabelStyle: { fontSize: fs(11) },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: Platform.OS === "ios" ? 88 : 64,
          paddingBottom: Platform.OS === "ios" ? 28 : 8,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t("tabHome"),
          tabBarIcon: ({ color, focused }: TabIconProps) => (
            <Ionicons size={26} name={focused ? "home" : "home-outline"} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="get-incidents"
        options={{
          title: t("tabIncidents"),
          tabBarIcon: ({ color, focused }: TabIconProps) => (
            <Ionicons size={26} name={focused ? "warning" : "warning-outline"} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="new-incident"
        options={{
          title: "",
          tabBarButton: () => <PlusButton />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: t("tabReports"),
          tabBarIcon: ({ color }: TabIconProps) => (
            <Ionicons name="bar-chart" size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("tabProfile"),
          tabBarIcon: ({ color, focused }: TabIconProps) => (
            <Ionicons size={26} name={focused ? "person" : "person-outline"} color={color} />
          ),
        }}
      />
      {/* Reachable from Accueil, not shown as tabs */}
      <Tabs.Screen name="trainings" options={{ href: null }} />
      <Tabs.Screen name="messages" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  plusWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  plus: {
    width: 62,
    height: 62,
    borderRadius: 31,
    marginTop: -22,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});
