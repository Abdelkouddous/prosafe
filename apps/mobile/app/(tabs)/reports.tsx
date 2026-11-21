import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppTheme } from "@/contexts/AccessibilityContext";
import {
  fetchIncidents,
  INCIDENT_TYPES,
  IncidentType,
} from "@/services/incidentApi";
import { fetchRewardsSummary, RewardsSummary } from "@/services/rewardsApi";
import { TranslationKey } from "@/constants/Languages";

interface MonthBar {
  label: string;
  count: number;
}

const pad = (n: number) => String(n).padStart(2, "0");
const isoDate = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Last `n` months (oldest first) with date-only from/to bounds. */
function lastMonths(n: number, locale: string) {
  const now = new Date();
  const out: { label: string; from: string; to: string }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    out.push({
      label: start.toLocaleDateString(locale, { month: "short" }),
      from: isoDate(start),
      to: isoDate(end),
    });
  }
  return out;
}

const badgeLabel = (b: RewardsSummary["badge"]) =>
  !b ? "-" : typeof b === "string" ? b : b.label || b.name || b.key || "-";

function BarChart({
  data,
  color,
  textColor,
  fs,
}: {
  data: MonthBar[];
  color: string;
  textColor: string;
  fs: (n: number) => number;
}) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <View style={styles.chart}>
      {data.map((d, i) => (
        <View key={`${d.label}-${i}`} style={styles.barCol}>
          <Text style={{ color: textColor, fontSize: fs(12), fontWeight: "700" }}>
            {d.count}
          </Text>
          <View style={styles.barTrack}>
            <View
              style={{
                height: `${(d.count / max) * 100}%`,
                minHeight: d.count > 0 ? 4 : 0,
                backgroundColor: color,
                borderRadius: 4,
              }}
            />
          </View>
          <Text style={{ color: textColor, fontSize: fs(11) }}>{d.label}</Text>
        </View>
      ))}
    </View>
  );
}

export default function ReportsScreen() {
  const { user } = useAuth();
  const { t, currentLanguage } = useLanguage();
  const { colors, fs } = useAppTheme();
  const [months, setMonths] = useState<MonthBar[] | null>(null);
  const [types, setTypes] = useState<{ type: IncidentType; count: number }[] | null>(null);
  const [rewards, setRewards] = useState<RewardsSummary | null>(null);
  const [errors, setErrors] = useState({ months: false, types: false, rewards: false });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isManager = user?.role === "admin" || user?.role === "sst_manager";

  const load = useCallback(async () => {
    const range = lastMonths(6, currentLanguage === "ar-DZ" ? "ar" : currentLanguage);
    const [monthRes, typeRes, rewardRes] = await Promise.all([
      Promise.allSettled(
        range.map((m) => fetchIncidents({ limit: 1, from: m.from, to: m.to }))
      ),
      Promise.allSettled(
        INCIDENT_TYPES.map((type) => fetchIncidents({ limit: 1, type }))
      ),
      Promise.allSettled([fetchRewardsSummary()]),
    ]);
    const monthsFailed = monthRes.some((r) => r.status === "rejected");
    setMonths(
      monthsFailed
        ? null
        : range.map((m, i) => ({
            label: m.label,
            count: (monthRes[i] as PromiseFulfilledResult<{ total: number }>).value.total,
          }))
    );
    const typesFailed = typeRes.some((r) => r.status === "rejected");
    setTypes(
      typesFailed
        ? null
        : INCIDENT_TYPES.map((type, i) => ({
            type,
            count: (typeRes[i] as PromiseFulfilledResult<{ total: number }>).value.total,
          })).filter((x) => x.count > 0)
    );
    const rw = rewardRes[0];
    setRewards(rw.status === "fulfilled" ? rw.value : null);
    setErrors({
      months: monthsFailed,
      types: typesFailed,
      rewards: rw.status === "rejected",
    });
    setLoading(false);
  }, [currentLanguage]);

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

  const card = [styles.card, { backgroundColor: colors.surface, borderColor: colors.border }];
  const title = [styles.cardTitle, { color: colors.text, fontSize: fs(16) }];
  const errorText = (
    <Text style={{ color: colors.danger, fontSize: fs(13) }}>{t("reportsLoadFailed")}</Text>
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={[styles.heading, { color: colors.text, fontSize: fs(24) }]}>
        {t("reportsTitle")}
      </Text>

      {isManager && (
        <View style={[styles.note, { borderColor: colors.info }]}>
          <Text style={{ color: colors.info, fontSize: fs(13) }}>{t("reportsManagerNote")}</Text>
        </View>
      )}

      {loading && <ActivityIndicator style={{ marginVertical: 20 }} color={colors.primary} />}

      <View style={card}>
        <Text style={title}>{t("reportsMonthly")}</Text>
        {errors.months ? (
          errorText
        ) : months ? (
          <BarChart data={months} color={colors.primary} textColor={colors.text} fs={fs} />
        ) : null}
      </View>

      <View style={card}>
        <Text style={title}>{t("reportsByType")}</Text>
        {errors.types ? (
          errorText
        ) : types && types.length === 0 ? (
          <Text style={{ color: colors.textSecondary, fontSize: fs(14) }}>{t("reportsNoData")}</Text>
        ) : (
          types?.map((row) => (
            <View key={row.type} style={styles.typeRow}>
              <Text style={{ color: colors.text, fontSize: fs(14), flex: 1 }}>
                {t(`type_${row.type}` as TranslationKey)}
              </Text>
              <Text style={{ color: colors.warning, fontSize: fs(16), fontWeight: "700" }}>
                {row.count}
              </Text>
            </View>
          ))
        )}
      </View>

      <View style={card}>
        <Text style={title}>{t("reportsRewards")}</Text>
        {errors.rewards ? (
          errorText
        ) : rewards ? (
          <>
            <View style={styles.statRow}>
              <View style={styles.stat}>
                <Text style={[styles.statValue, { color: colors.success, fontSize: fs(24) }]}>
                  {rewards.totalPoints}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: fs(12) }}>
                  {t("reportsTotalPoints")}
                </Text>
              </View>
              <View style={styles.stat}>
                <Text style={[styles.statValue, { color: colors.text, fontSize: fs(24) }]}>
                  {rewards.rank ?? "-"}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: fs(12) }}>
                  {t("reportsRank")}
                </Text>
              </View>
              <View style={styles.stat}>
                <Text style={[styles.statValue, { color: colors.text, fontSize: fs(18) }]}>
                  {badgeLabel(rewards.badge)}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: fs(12) }}>
                  {t("reportsBadge")}
                </Text>
              </View>
            </View>
            {rewards.nextBadgeAt != null && (
              <Text style={{ color: colors.textSecondary, fontSize: fs(13), marginTop: 8 }}>
                {t("reportsNextBadge").replace("{points}", String(rewards.nextBadgeAt))}
              </Text>
            )}
          </>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingTop: 56, paddingBottom: 32 },
  heading: { fontWeight: "700", marginBottom: 12 },
  note: { borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 12 },
  card: { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 12 },
  cardTitle: { fontWeight: "700", marginBottom: 10 },
  chart: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  barCol: { flex: 1, alignItems: "center", gap: 4 },
  barTrack: { height: 110, width: "70%", justifyContent: "flex-end" },
  typeRow: { flexDirection: "row", alignItems: "center", paddingVertical: 4 },
  statRow: { flexDirection: "row" },
  stat: { flex: 1, alignItems: "center" },
  statValue: { fontWeight: "800" },
});
