import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { TouchableOpacity } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppTheme } from "@/contexts/AccessibilityContext";
import {
  fetchIncidents,
  INCIDENT_TYPES,
  IncidentType,
} from "@/services/incidentApi";
import { fetchRewardsSummary, RewardsSummary } from "@/services/rewardsApi";
import {
  fetchStatsForecast,
  fetchStatsIncidents,
  fetchStatsKpis,
  StatsBucket,
  StatsForecast,
  StatsKpis,
} from "@/services/statsApi";
import { TranslationKey } from "@/constants/Languages";

interface MonthBar {
  label: string;
  count: number;
  forecast?: boolean;
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

const monthLabel = (key: string, locale: string) => {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, (m || 1) - 1, 1).toLocaleDateString(locale, { month: "short" });
};

const KPI_NONE = "-";

function BarChart({
  data,
  color,
  textColor,
  fs,
  lightColor,
}: {
  data: MonthBar[];
  lightColor?: string;
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
            {Number.isInteger(d.count) ? d.count : d.count.toFixed(1)}
          </Text>
          <View style={styles.barTrack}>
            <View
              style={{
                height: `${(d.count / max) * 100}%`,
                minHeight: d.count > 0 ? 4 : 0,
                backgroundColor: d.forecast ? lightColor ?? color : color,
                borderWidth: d.forecast ? 1 : 0,
                borderStyle: "dashed",
                borderColor: color,
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
  const [zones, setZones] = useState<StatsBucket[] | null>(null);
  const [kpis, setKpis] = useState<StatsKpis | null>(null);
  const [forecast, setForecast] = useState<MonthBar[] | null>(null);
  const [errors, setErrors] = useState({
    months: false,
    types: false,
    rewards: false,
    zones: false,
    kpis: false,
    forecast: false,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isManager = user?.role === "admin" || user?.role === "sst_manager";

  const loadManager = useCallback(
    async (range: ReturnType<typeof lastMonths>, locale: string) => {
      const from = range[0].from;
      const [monthRes, typeRes, zoneRes, kpiRes, fcRes, rewardRes] = await Promise.allSettled([
        fetchStatsIncidents({ groupBy: "month", from }),
        fetchStatsIncidents({ groupBy: "type", from }),
        fetchStatsIncidents({ groupBy: "zone", from }),
        fetchStatsKpis(),
        fetchStatsForecast(3),
        fetchRewardsSummary(),
      ]);
      if (monthRes.status === "fulfilled") {
        const byKey = new Map(monthRes.value.map((b) => [b.key, b.count]));
        setMonths(
          range.map((m) => ({ label: m.label, count: byKey.get(m.from.slice(0, 7)) ?? 0 }))
        );
      } else setMonths(null);
      setTypes(
        typeRes.status === "fulfilled"
          ? typeRes.value
              .filter((b) => (INCIDENT_TYPES as readonly string[]).includes(b.key))
              .map((b) => ({ type: b.key as IncidentType, count: b.count }))
          : null
      );
      setZones(zoneRes.status === "fulfilled" ? zoneRes.value.slice(0, 6) : null);
      setKpis(kpiRes.status === "fulfilled" ? kpiRes.value : null);
      if (fcRes.status === "fulfilled") {
        const fc: StatsForecast = fcRes.value;
        setForecast([
          ...fc.history.slice(-6).map((h) => ({ label: monthLabel(h.month, locale), count: h.count })),
          ...fc.forecast
            .filter((f) => f.method === "linear_regression")
            .map((f) => ({ label: monthLabel(f.month, locale), count: f.count, forecast: true })),
        ]);
      } else setForecast(null);
      setRewards(rewardRes.status === "fulfilled" ? rewardRes.value : null);
      setErrors({
        months: monthRes.status === "rejected",
        types: typeRes.status === "rejected",
        zones: zoneRes.status === "rejected",
        kpis: kpiRes.status === "rejected",
        forecast: fcRes.status === "rejected",
        rewards: rewardRes.status === "rejected",
      });
    },
    []
  );

  const loadEmployee = useCallback(async (range: ReturnType<typeof lastMonths>) => {
    // /stats/incidents is manager-only: employees keep per-month / per-type counts
    const [monthRes, typeRes, rewardRes] = await Promise.all([
      Promise.allSettled(range.map((m) => fetchIncidents({ limit: 1, from: m.from, to: m.to }))),
      Promise.allSettled(INCIDENT_TYPES.map((type) => fetchIncidents({ limit: 1, type }))),
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
    setErrors((e) => ({
      ...e,
      months: monthsFailed,
      types: typesFailed,
      rewards: rw.status === "rejected",
    }));
  }, []);

  const load = useCallback(async () => {
    const locale = currentLanguage === "ar-DZ" ? "ar" : currentLanguage;
    const range = lastMonths(6, locale);
    if (isManager) await loadManager(range, locale);
    else await loadEmployee(range);
    setLoading(false);
  }, [currentLanguage, isManager, loadManager, loadEmployee]);

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

  const rateColor = (v: number | null) =>
    v == null ? colors.textSecondary : v >= 80 ? colors.success : v >= 50 ? colors.warning : colors.danger;
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

      {isManager && (
        <>
          <View style={card}>
            <Text style={title}>{t("reportsByZone")}</Text>
            {errors.zones ? (
              errorText
            ) : zones && zones.length === 0 ? (
              <Text style={{ color: colors.textSecondary, fontSize: fs(14) }}>{t("reportsNoData")}</Text>
            ) : (
              zones?.map((row) => (
                <View key={row.key} style={styles.typeRow}>
                  <Text style={{ color: colors.text, fontSize: fs(14), flex: 1 }}>{row.key}</Text>
                  <Text style={{ color: colors.warning, fontSize: fs(16), fontWeight: "700" }}>
                    {row.count}
                  </Text>
                </View>
              ))
            )}
          </View>

          <View style={card}>
            <Text style={title}>{t("reportsKpis")}</Text>
            {errors.kpis ? (
              errorText
            ) : kpis ? (
              <View style={styles.kpiGrid}>
                {[
                  {
                    label: t("kpiMeanResolution"),
                    value:
                      kpis.meanResolutionHours == null
                        ? KPI_NONE
                        : `${Math.round(kpis.meanResolutionHours * 10) / 10} ${t("reportsHoursUnit")}`,
                    color: colors.primary,
                  },
                  {
                    label: t("kpiEquipmentCompliance"),
                    value: kpis.equipmentComplianceRate == null ? KPI_NONE : `${kpis.equipmentComplianceRate}%`,
                    color: rateColor(kpis.equipmentComplianceRate),
                  },
                  {
                    label: t("kpiTrainingCompliance"),
                    value: kpis.trainingComplianceRate == null ? KPI_NONE : `${kpis.trainingComplianceRate}%`,
                    color: rateColor(kpis.trainingComplianceRate),
                  },
                  {
                    label: t("kpiOverdueActions"),
                    value: String(kpis.correctiveActionsOverdue),
                    color: kpis.correctiveActionsOverdue > 0 ? colors.danger : colors.success,
                  },
                ].map((k) => (
                  <View
                    key={k.label}
                    style={[styles.kpi, { borderColor: colors.border, backgroundColor: colors.background }]}
                  >
                    <Text style={{ color: k.color, fontSize: fs(20), fontWeight: "800" }}>{k.value}</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: fs(11), textAlign: "center" }}>
                      {k.label}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>

          <View style={card}>
            <Text style={title}>{t("reportsForecast")}</Text>
            {errors.forecast ? (
              errorText
            ) : forecast ? (
              <>
                <BarChart
                  data={forecast}
                  color={colors.warning}
                  lightColor={colors.warning + "55"}
                  textColor={colors.text}
                  fs={fs}
                />
                <Text style={{ color: colors.textSecondary, fontSize: fs(12), marginTop: 8 }}>
                  {t("reportsForecastHint")}
                </Text>
              </>
            ) : null}
          </View>
        </>
      )}

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
                  {rewards.badge ? t(`badge_${rewards.badge}` as TranslationKey) : "-"}
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
            <TouchableOpacity onPress={() => router.push("/(extra)/rewards")} style={{ marginTop: 10 }}>
              <Text style={{ color: colors.primary, fontSize: fs(14), fontWeight: "700" }}>
                {t("reportsSeeRewards")}
              </Text>
            </TouchableOpacity>
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
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  kpi: {
    width: "48%",
    flexGrow: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: "center",
    gap: 4,
  },
  statValue: { fontWeight: "800" },
});
