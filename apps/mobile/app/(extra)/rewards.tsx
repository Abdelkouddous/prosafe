import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
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
import { TranslationKey } from "@/constants/Languages";
import {
  BADGE_THRESHOLDS,
  BadgeKey,
  LeaderboardPeriod,
  LeaderboardRow,
  RewardEntry,
  RewardsSummary,
  fetchLeaderboard,
  fetchMyRewards,
  fetchRewardsSummary,
} from "@/services/rewardsApi";

const BADGE_COLORS: Record<BadgeKey, string> = {
  bronze: "#B45309",
  silver: "#6B7280",
  gold: "#CA8A04",
  platinum: "#0E7490",
};
const BADGE_ORDER: BadgeKey[] = ["bronze", "silver", "gold", "platinum"];
const PERIODS: { key: LeaderboardPeriod; label: TranslationKey }[] = [
  { key: "month", label: "rewardsPeriodMonth" },
  { key: "year", label: "rewardsPeriodYear" },
  { key: "all", label: "rewardsPeriodAll" },
];

export default function RewardsScreen() {
  const { user } = useAuth();
  const { t, isRTL, currentLanguage } = useLanguage();
  const { colors, fs } = useAppTheme();
  const [summary, setSummary] = useState<RewardsSummary | null>(null);
  const [history, setHistory] = useState<RewardEntry[] | null>(null);
  const [board, setBoard] = useState<LeaderboardRow[] | null>(null);
  const [period, setPeriod] = useState<LeaderboardPeriod>("month");
  const [errors, setErrors] = useState({ summary: false, history: false, board: false });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const myId = user?.id !== undefined ? String(user.id) : null;

  const loadBoard = useCallback(async (p: LeaderboardPeriod) => {
    try {
      setBoard(await fetchLeaderboard(p, 10));
      setErrors((e) => ({ ...e, board: false }));
    } catch {
      setBoard(null);
      setErrors((e) => ({ ...e, board: true }));
    }
  }, []);

  const load = useCallback(async () => {
    const [s, h] = await Promise.allSettled([fetchRewardsSummary(), fetchMyRewards()]);
    setSummary(s.status === "fulfilled" ? s.value : null);
    setHistory(h.status === "fulfilled" ? h.value : null);
    setErrors((e) => ({ ...e, summary: s.status === "rejected", history: h.status === "rejected" }));
    await loadBoard(period);
    setLoading(false);
  }, [loadBoard, period]);

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

  const choosePeriod = (p: LeaderboardPeriod) => {
    setPeriod(p);
    loadBoard(p);
  };

  const card = [styles.card, { backgroundColor: colors.surface, borderColor: colors.border }];
  const title = [styles.cardTitle, { color: colors.text, fontSize: fs(16) }];
  const errorText = (
    <Text style={{ color: colors.danger, fontSize: fs(13) }}>{t("rewardsLoadFailed")}</Text>
  );

  const badge = summary?.badge ?? null;
  const badgeColor = badge ? BADGE_COLORS[badge] : colors.textSecondary;
  // Progress toward the next badge: from the current badge threshold to the next one
  const progress = (() => {
    if (!summary || summary.nextBadgeAt == null) return badge ? 1 : 0;
    const base = badge ? BADGE_THRESHOLDS[badge] : 0;
    const next = summary.totalPoints + summary.nextBadgeAt;
    return Math.max(0, Math.min(1, (summary.totalPoints - base) / Math.max(1, next - base)));
  })();

  const reasonLabel = (r: RewardEntry) =>
    r.reason === "incident_rejected"
      ? t("rewardsReasonIncidentRejected")
      : r.reason === "incident_report"
      ? t("rewardsReasonIncidentReport")
      : r.reason || "-";

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, direction: isRTL ? "rtl" : "ltr" }}>
      <View style={[styles.topBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)/home"))}
          accessibilityRole="button"
          style={{ padding: 6 }}
        >
          <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ color: colors.text, fontSize: fs(18), fontWeight: "700" }}>
          {t("rewardsTitle")}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading && <ActivityIndicator style={{ marginVertical: 20 }} color={colors.primary} />}

        <View style={card}>
          <Text style={title}>{t("rewardsMyPoints")}</Text>
          {errors.summary ? (
            errorText
          ) : summary ? (
            <>
              <View style={styles.summaryRow}>
                <View style={styles.stat}>
                  <Text style={{ color: colors.success, fontSize: fs(32), fontWeight: "800" }}>
                    {summary.totalPoints}
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: fs(12) }}>
                    {t("reportsTotalPoints")}
                  </Text>
                </View>
                <View style={styles.stat}>
                  <Ionicons name={badge ? "ribbon" : "ribbon-outline"} size={40} color={badgeColor} />
                  <Text style={{ color: badgeColor, fontSize: fs(14), fontWeight: "700" }}>
                    {badge ? t(`badge_${badge}` as TranslationKey) : t("rewardsNoBadge")}
                  </Text>
                </View>
                <View style={styles.stat}>
                  <Text style={{ color: colors.text, fontSize: fs(32), fontWeight: "800" }}>
                    {summary.rank ?? "-"}
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: fs(12) }}>{t("reportsRank")}</Text>
                </View>
              </View>
              <View style={[styles.track, { backgroundColor: colors.border }]}>
                <View
                  style={{
                    width: `${Math.round(progress * 100)}%`,
                    height: "100%",
                    backgroundColor: colors.success,
                  }}
                />
              </View>
              <Text style={{ color: colors.textSecondary, fontSize: fs(13), marginTop: 6 }}>
                {summary.nextBadgeAt == null
                  ? badge
                    ? t("rewardsTopBadge")
                    : ""
                  : t("rewardsProgress").replace("{points}", String(summary.nextBadgeAt))}
              </Text>
              <View style={styles.badgeRow}>
                {BADGE_ORDER.map((b) => {
                  const reached = summary.totalPoints >= BADGE_THRESHOLDS[b];
                  return (
                    <View key={b} style={styles.badgeItem}>
                      <Ionicons
                        name={reached ? "ribbon" : "ribbon-outline"}
                        size={22}
                        color={reached ? BADGE_COLORS[b] : colors.textSecondary}
                      />
                      <Text style={{ color: colors.textSecondary, fontSize: fs(10) }}>
                        {BADGE_THRESHOLDS[b]}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </>
          ) : null}
        </View>

        <View style={card}>
          <Text style={title}>{t("rewardsLeaderboard")}</Text>
          <View style={styles.segments}>
            {PERIODS.map((p) => {
              const active = p.key === period;
              return (
                <TouchableOpacity
                  key={p.key}
                  onPress={() => choosePeriod(p.key)}
                  style={[
                    styles.segment,
                    { borderColor: colors.primary, backgroundColor: active ? colors.primary : "transparent" },
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={{ color: active ? "#FFFFFF" : colors.primary, fontSize: fs(13), fontWeight: "600" }}>
                    {t(p.label)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {errors.board ? (
            errorText
          ) : board && board.length === 0 ? (
            <Text style={{ color: colors.textSecondary, fontSize: fs(14) }}>
              {t("rewardsLeaderboardEmpty")}
            </Text>
          ) : (
            board?.map((r) => {
              const me = myId !== null && String(r.userId) === myId;
              return (
                <View
                  key={r.userId}
                  style={[styles.boardRow, me && { backgroundColor: colors.success + "22" }]}
                >
                  <Text style={{ color: colors.text, fontSize: fs(15), fontWeight: "800", width: 30 }}>
                    {r.rank}
                  </Text>
                  <Text style={{ color: colors.text, fontSize: fs(14), flex: 1 }} numberOfLines={1}>
                    {`${r.firstName} ${r.lastName}`.trim()}
                    {me ? ` (${t("rewardsYou")})` : ""}
                  </Text>
                  {r.badge && <Ionicons name="ribbon" size={18} color={BADGE_COLORS[r.badge]} />}
                  <Text style={{ color: colors.success, fontSize: fs(15), fontWeight: "700", minWidth: 40, textAlign: "right" }}>
                    {r.points}
                  </Text>
                </View>
              );
            })
          )}
        </View>

        <View style={card}>
          <Text style={title}>{t("rewardsHistory")}</Text>
          {errors.history ? (
            errorText
          ) : history && history.length === 0 ? (
            <Text style={{ color: colors.textSecondary, fontSize: fs(14) }}>
              {t("rewardsHistoryEmpty")}
            </Text>
          ) : (
            history?.map((r) => (
              <View key={r.id} style={styles.boardRow}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontSize: fs(14) }}>{reasonLabel(r)}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: fs(12) }}>
                    {[r.incidentId, new Date(r.created_at).toLocaleDateString(currentLanguage)]
                      .filter(Boolean)
                      .join(" - ")}
                  </Text>
                </View>
                <Text
                  style={{
                    color: r.points > 0 ? colors.success : colors.danger,
                    fontSize: fs(15),
                    fontWeight: "700",
                  }}
                >
                  {r.points > 0 ? `+${r.points}` : r.points}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  content: { padding: 16, paddingBottom: 40 },
  card: { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 12 },
  cardTitle: { fontWeight: "700", marginBottom: 10 },
  summaryRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  stat: { flex: 1, alignItems: "center", gap: 2 },
  track: { height: 10, borderRadius: 5, overflow: "hidden" },
  badgeRow: { flexDirection: "row", justifyContent: "space-around", marginTop: 12 },
  badgeItem: { alignItems: "center", gap: 2 },
  segments: { flexDirection: "row", gap: 8, marginBottom: 10 },
  segment: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 7,
    alignItems: "center",
  },
  boardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 6,
  },
});
