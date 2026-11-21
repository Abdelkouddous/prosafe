import React, { useCallback, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppTheme } from "@/contexts/AccessibilityContext";
import { fetchStatsOverview } from "@/services/statsApi";
import { fetchNotifications } from "@/services/notificationApi";
import { TranslationKey } from "@/constants/Languages";

type Overview = Awaited<ReturnType<typeof fetchStatsOverview>>;

interface Module {
  id: string;
  labelKey: TranslationKey;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  href: string;
}

export default function HomeScreen() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { colors, fs } = useAppTheme();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [unread, setUnread] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const isManager = user?.role === "admin" || user?.role === "sst_manager";
  const firstName = (user?.name || "").split(" ")[0];

  const load = useCallback(async () => {
    const [ov, un] = await Promise.allSettled([
      fetchStatsOverview(),
      fetchNotifications({ unread: true, limit: 1 }),
    ]);
    setOverview(ov.status === "fulfilled" ? ov.value : null);
    setUnread(un.status === "fulfilled" ? un.value.total : null);
    setFailed(ov.status === "rejected" || un.status === "rejected");
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const modules: Module[] = [
    { id: "trainings", labelKey: "moduleTrainings", icon: "school", color: colors.primary, href: "/(tabs)/trainings" },
    { id: "messages", labelKey: "moduleMessages", icon: "chatbubbles", color: colors.info, href: "/(tabs)/messages" },
    { id: "rewards", labelKey: "moduleRewards", icon: "trophy", color: colors.warning, href: "/(extra)/rewards" },
    { id: "stock", labelKey: "moduleStock", icon: "construct", color: colors.warning, href: "/(extra)/stock" },
    { id: "emergency", labelKey: "moduleEmergency", icon: "alert-circle", color: colors.danger, href: "/(extra)/emergency" },
    { id: "lmra", labelKey: "moduleLmra", icon: "shield-checkmark", color: colors.success, href: "/(extra)/lmra" },
    { id: "information", labelKey: "moduleInformation", icon: "information-circle", color: colors.info, href: "/(extra)/information" },
    { id: "flashcards", labelKey: "moduleFlashcards", icon: "card", color: colors.success, href: "/(extra)/flashcards" },
    { id: "news", labelKey: "moduleNews", icon: "newspaper", color: colors.primary, href: "/(extra)/news" },
    { id: "safety-manual", labelKey: "moduleSafetyManual", icon: "book", color: colors.primary, href: "/(extra)/safety-manual" },
    { id: "notifications", labelKey: "moduleNotifications", icon: "notifications", color: colors.warning, href: "/(extra)/notifications" },
  ];

  const show = (n: number | null) => (n === null ? "-" : String(n));

  const inc = overview?.incidents;
  const cards: { key: TranslationKey; value: number | null; color: string }[] = [
    { key: "homeMyIncidents", value: inc?.total ?? null, color: colors.primary },
    { key: "homeStatusPending", value: inc?.open ?? null, color: colors.warning },
    { key: "homeStatusInProgress", value: inc?.investigating ?? null, color: colors.info },
    { key: "homeStatusResolved", value: inc?.resolved ?? null, color: colors.success },
  ];
  const alerts = overview?.activeAlerts ?? null;
  const alertColor = alerts !== null && alerts > 0 ? colors.danger : colors.success;
  const managerCards: { key: TranslationKey; value: number | null; hot: boolean }[] = [
    { key: "homeCriticalOpen", value: overview?.criticalOpen ?? null, hot: true },
    { key: "homeLowStock", value: overview?.lowStock ?? null, hot: false },
    { key: "homeOverdueMaintenance", value: overview?.overdueMaintenance ?? null, hot: false },
    { key: "homeExpiringTrainings", value: overview?.expiringTrainings ?? null, hot: false },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={[styles.greeting, { fontSize: fs(24), color: colors.text }]}>
        {t("homeGreeting").replace("{name}", firstName)}
      </Text>

      {failed && (
        <Text style={{ color: colors.danger, fontSize: fs(13), marginBottom: 8 }}>
          {t("homeCardsLoadFailed")}
        </Text>
      )}

      <View style={styles.cardRow}>
        {cards.map((c) => (
          <View
            key={c.key}
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Text style={[styles.cardValue, { color: c.color, fontSize: fs(24) }]}>
              {show(c.value)}
            </Text>
            <Text style={[styles.cardLabel, { color: colors.textSecondary, fontSize: fs(11) }]}>
              {t(c.key)}
            </Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[
          styles.notifCard,
          { backgroundColor: colors.surface, borderColor: alertColor, borderWidth: 2, marginBottom: 10 },
        ]}
        onPress={() => router.push("/(extra)/emergency")}
      >
        <Ionicons name="warning" size={22} color={alertColor} />
        <Text style={[styles.notifLabel, { color: colors.text, fontSize: fs(15) }]}>
          {t("homeActiveAlerts")}
        </Text>
        <Text style={[styles.notifValue, { color: alertColor, fontSize: fs(18) }]}>
          {show(alerts)}
        </Text>
      </TouchableOpacity>

      {isManager && (
        <View style={styles.cardRow}>
          {managerCards.map((c) => {
            const color = c.value !== null && c.value > 0 ? (c.hot ? colors.danger : colors.warning) : colors.success;
            return (
              <View
                key={c.key}
                style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <Text style={[styles.cardValue, { color, fontSize: fs(22) }]}>{show(c.value)}</Text>
                <Text style={[styles.cardLabel, { color: colors.textSecondary, fontSize: fs(10) }]}>
                  {t(c.key)}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      <TouchableOpacity
        style={[styles.notifCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => router.push("/(extra)/notifications")}
      >
        <Ionicons name="notifications" size={22} color={colors.warning} />
        <Text style={[styles.notifLabel, { color: colors.text, fontSize: fs(15) }]}>
          {t("homeUnreadNotifications")}
        </Text>
        <Text style={[styles.notifValue, { color: colors.warning, fontSize: fs(18) }]}>
          {show(unread)}
        </Text>
      </TouchableOpacity>

      <Text style={[styles.section, { color: colors.text, fontSize: fs(18) }]}>
        {t("homeQuickAccess")}
      </Text>
      <TouchableOpacity
        style={[styles.primaryBtn, { backgroundColor: colors.danger }]}
        onPress={() => router.push("/incident/new")}
      >
        <Ionicons name="warning" size={22} color="#FFFFFF" />
        <Text style={[styles.btnText, { fontSize: fs(16) }]}>{t("homeReportIncident")}</Text>
      </TouchableOpacity>
      <View style={styles.btnRow}>
        <TouchableOpacity
          style={[styles.secondaryBtn, { backgroundColor: colors.warning }]}
          onPress={() => router.push("/(extra)/risks")}
        >
          <Ionicons name="flame" size={20} color="#FFFFFF" />
          <Text style={[styles.btnText, { fontSize: fs(14) }]}>{t("homeViewRisks")}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.secondaryBtn, { backgroundColor: colors.success }]}
          onPress={() => router.push("/(tabs)/reports")}
        >
          <Ionicons name="bar-chart" size={20} color="#FFFFFF" />
          <Text style={[styles.btnText, { fontSize: fs(14) }]}>{t("homeOpenReports")}</Text>
        </TouchableOpacity>
      </View>

      {isManager && (
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: colors.primary, marginTop: 10 }]}
          onPress={() => router.push("/dashboard")}
        >
          <Ionicons name="speedometer" size={22} color="#FFFFFF" />
          <Text style={[styles.btnText, { fontSize: fs(16) }]}>{t("homeManagerDashboard")}</Text>
        </TouchableOpacity>
      )}

      <Text style={[styles.section, { color: colors.text, fontSize: fs(18) }]}>
        {t("homeModules")}
      </Text>
      <View style={styles.grid}>
        {modules.map((m) => (
          <TouchableOpacity
            key={m.id}
            style={[styles.module, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => router.push(m.href as never)}
          >
            <Ionicons name={m.icon} size={28} color={m.color} />
            <Text
              style={[styles.moduleLabel, { color: colors.text, fontSize: fs(12) }]}
              numberOfLines={2}
            >
              {t(m.labelKey)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingTop: 56, paddingBottom: 32 },
  greeting: { fontWeight: "700", marginBottom: 14 },
  cardRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  card: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  cardValue: { fontWeight: "800" },
  cardLabel: { textAlign: "center", marginTop: 2 },
  notifCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  notifLabel: { flex: 1 },
  notifValue: { fontWeight: "800" },
  section: { fontWeight: "700", marginTop: 20, marginBottom: 10 },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    paddingVertical: 14,
  },
  btnRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  secondaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 6,
  },
  btnText: { color: "#FFFFFF", fontWeight: "700", flexShrink: 1, textAlign: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  module: {
    width: "31%",
    flexGrow: 1,
    minWidth: 96,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 6,
    alignItems: "center",
    gap: 8,
  },
  moduleLabel: { textAlign: "center", fontWeight: "600" },
});
