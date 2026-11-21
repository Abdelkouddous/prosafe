import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  NotificationPreferences,
  fetchPreferences,
  updatePreferences,
} from "@/services/notificationApi";

const PREF_KEYS = [
  ["incidents", "prefIncidents"],
  ["trainings", "prefTrainings"],
  ["audits", "prefAudits"],
  ["inventory", "prefInventory"],
  ["emergency", "prefEmergency"],
  ["messages", "prefMessages"],
  ["push", "prefPush"],
  ["email", "prefEmail"],
] as const;

export default function ProfileScreen() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [prefsError, setPrefsError] = useState<string | null>(null);

  useEffect(() => {
    fetchPreferences()
      .then(setPrefs)
      .catch(() => setPrefsError(t("prefLoadFailed")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const togglePref = async (key: keyof NotificationPreferences, value: boolean) => {
    if (!prefs) return;
    const previous = prefs;
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    setPrefsError(null);
    try {
      setPrefs(await updatePreferences(next));
    } catch {
      setPrefs(previous);
      setPrefsError(t("prefSaveFailed"));
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>PROSAFE</Text>
            <Text style={styles.logoSubtext}>PROFILE</Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.label}>Name / Nom:</Text>
          <Text style={styles.value}>{user?.name || "N/A"}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{user?.email || "N/A"}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Role / Rôle:</Text>
          <Text style={styles.value}>{user?.role || "N/A"}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>{t("notificationPreferences")}</Text>
          {prefsError && <Text style={{ color: "#DC2626", marginBottom: 6 }}>{prefsError}</Text>}
          {!prefs && !prefsError && <ActivityIndicator />}
          {prefs &&
            PREF_KEYS.map(([key, label]) => (
              <View key={key} style={styles.prefRow}>
                <Text style={styles.value}>{t(label)}</Text>
                <Switch
                  value={!!prefs[key]}
                  onValueChange={(v) => togglePref(key, v)}
                />
              </View>
            ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  prefRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    backgroundColor: "#FFFFFE",
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    alignItems: "center",
  },
  logoText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
    letterSpacing: 2,
  },
  logoSubtext: {
    fontSize: 10,
    color: "#6B7280",
    letterSpacing: 1,
    marginTop: 2,
  },
  //
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  content: {
    padding: 20,
  },
  section: {
    backgroundColor: "white",
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  value: {
    fontSize: 16,
    color: "#666",
  },
  manualSection: {
    marginTop: 20,
  },
  manualTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 16,
    textAlign: "center",
  },
  manualItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  manualItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  manualItemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  manualItemSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
  },
});
