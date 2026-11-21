import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import { useLanguage } from "@/contexts/LanguageContext";
import { Chip } from "@/components/Chip";
import { SEVERITY_COLORS, STATUS_COLORS } from "@/constants/incidentUi";
import { fetchMyRewardsSummary } from "@/services/api";
import {
  INCIDENT_TYPES,
  Incident,
  IncidentStatus,
  IncidentType,
  fetchIncidents,
} from "@/services/incidentApi";

const PAGE_SIZE = 15;

type StatusFilter = IncidentStatus | "all";
type Period = "7" | "30" | "all";

const STATUS_CHIPS: { value: StatusFilter; key: "all" | "statusPending" | "statusInProgress" | "statusResolvedPlural" | "statusClosedPlural" }[] = [
  { value: "all", key: "all" },
  { value: "open", key: "statusPending" },
  { value: "investigating", key: "statusInProgress" },
  { value: "resolved", key: "statusResolvedPlural" },
  { value: "closed", key: "statusClosedPlural" },
];

export default function IncidentsListScreen() {
  const { t, isRTL, currentLanguage } = useLanguage();

  const [items, setItems] = useState<Incident[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const [status, setStatus] = useState<StatusFilter>("all");
  const [type, setType] = useState<IncidentType | "all">("all");
  const [period, setPeriod] = useState<Period>("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [points, setPoints] = useState<number | null>(null);
  const requestSeq = useRef(0);

  // debounce search
  useEffect(() => {
    const id = setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => clearTimeout(id);
  }, [searchInput]);

  const load = useCallback(
    async (targetPage: number, mode: "replace" | "append") => {
      const seq = ++requestSeq.current;
      try {
        const from =
          period === "all"
            ? undefined
            : new Date(Date.now() - Number(period) * 86400000).toISOString();
        const res = await fetchIncidents({
          page: targetPage,
          limit: PAGE_SIZE,
          status: status === "all" ? undefined : status,
          type: type === "all" ? undefined : type,
          from,
          search: search || undefined,
        });
        if (seq !== requestSeq.current) return; // stale response
        setItems((cur) => (mode === "append" ? [...cur, ...res.data] : res.data));
        setTotal(res.total);
        setPage(targetPage);
        setError(false);
      } catch {
        if (seq === requestSeq.current) setError(true);
      } finally {
        if (seq === requestSeq.current) {
          setLoading(false);
          setLoadingMore(false);
          setRefreshing(false);
        }
      }
    },
    [status, type, period, search]
  );

  useEffect(() => {
    setLoading(true);
    load(1, "replace");
  }, [load]);

  const loadPoints = useCallback(async () => {
    try {
      const s = await fetchMyRewardsSummary();
      if (typeof s?.totalPoints === "number") setPoints(s.totalPoints);
    } catch {
      // points card is optional: do not block the list
    }
  }, []);

  useEffect(() => {
    loadPoints();
  }, [loadPoints]);

  const onRefresh = () => {
    setRefreshing(true);
    load(1, "replace");
    loadPoints();
  };

  const onEndReached = () => {
    if (loading || loadingMore || error || items.length >= total) return;
    setLoadingMore(true);
    load(page + 1, "append");
  };

  const locale = currentLanguage === "ar-DZ" ? "ar-DZ" : currentLanguage;
  const dir = { direction: isRTL ? ("rtl" as const) : ("ltr" as const) };

  const renderItem = ({ item }: { item: Incident }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        router.push({ pathname: "/incident/[id]", params: { id: String(item.id) } })
      }
    >
      <View style={styles.cardHeader}>
        <Text style={styles.code}>{item.incidentId}</Text>
        <Text style={styles.date}>
          {new Date(item.timestamp ?? item.createdAt).toLocaleDateString(locale)}
        </Text>
      </View>
      <Text style={styles.cardTitle}>{t(`type_${item.type}` as const)}</Text>
      {!!item.description && (
        <Text style={styles.desc} numberOfLines={2}>
          {item.description}
        </Text>
      )}
      <View style={styles.badges}>
        <View style={[styles.badge, { backgroundColor: SEVERITY_COLORS[item.severity] }]}>
          <Text style={styles.badgeText}>{t(`severity_${item.severity}` as const)}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: STATUS_COLORS[item.status] }]}>
          <Text style={styles.badgeText}>{t(`status_${item.status}` as const)}</Text>
        </View>
        {!!item.media?.length && (
          <Text style={styles.mediaCount}>{item.media.length} 📎</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const header = (
    <View>
      <View style={styles.pointsCard}>
        <Text style={styles.pointsLabel}>{t("points")}</Text>
        <Text style={styles.pointsValue}>
          {points ?? "-"} {t("pts")}
        </Text>
      </View>

      <TextInput
        style={[styles.search, { textAlign: isRTL ? "right" : "left" }]}
        value={searchInput}
        onChangeText={setSearchInput}
        placeholder={t("searchIncidents")}
        returnKeyType="search"
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
        {STATUS_CHIPS.map((c) => (
          <Chip
            key={c.value}
            label={t(c.key)}
            selected={status === c.value}
            color={c.value === "all" ? "#2563EB" : STATUS_COLORS[c.value as IncidentStatus]}
            onPress={() => setStatus(c.value)}
          />
        ))}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
        <Chip label={t("all")} selected={type === "all"} onPress={() => setType("all")} />
        {INCIDENT_TYPES.map((v) => (
          <Chip
            key={v}
            label={t(`type_${v}` as const)}
            selected={type === v}
            onPress={() => setType(v)}
          />
        ))}
      </ScrollView>

      <View style={styles.periodRow}>
        <Text style={styles.periodLabel}>{t("period")}:</Text>
        <Chip label={t("period7")} selected={period === "7"} onPress={() => setPeriod("7")} />
        <Chip label={t("period30")} selected={period === "30"} onPress={() => setPeriod("30")} />
        <Chip label={t("periodAll")} selected={period === "all"} onPress={() => setPeriod("all")} />
      </View>
    </View>
  );

  return (
    <View style={[styles.container, dir]}>
      <Text style={styles.title}>{t("myIncidents")}</Text>
      <FlatList
        data={items}
        keyExtractor={(i) => String(i.id)}
        renderItem={renderItem}
        ListHeaderComponent={header}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.4}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator style={styles.center} size="large" color="#2563EB" />
          ) : error ? (
            <View style={styles.center}>
              <Text style={styles.errorText}>{t("loadFailed")}</Text>
              <TouchableOpacity onPress={() => { setLoading(true); load(1, "replace"); }}>
                <Text style={styles.link}>{t("retry")}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={[styles.center, styles.emptyText]}>{t("noIncidents")}</Text>
          )
        }
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator style={{ margin: 16 }} color="#2563EB" />
          ) : items.length > 0 && items.length < total ? (
            <TouchableOpacity onPress={onEndReached}>
              <Text style={[styles.link, { textAlign: "center", margin: 16 }]}>{t("loadMore")}</Text>
            </TouchableOpacity>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5", paddingTop: 50 },
  title: { fontSize: 22, fontWeight: "bold", color: "#1F2937", paddingHorizontal: 16, marginBottom: 8 },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  pointsCard: {
    backgroundColor: "#16A34A",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  pointsLabel: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  pointsValue: { color: "#FFFFFF", fontSize: 22, fontWeight: "bold" },
  search: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    marginBottom: 10,
  },
  chipsRow: { flexGrow: 0, marginBottom: 2 },
  periodRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", marginBottom: 8 },
  periodLabel: { fontSize: 14, color: "#374151", marginRight: 8, marginBottom: 8 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between" },
  code: { fontSize: 13, color: "#6B7280", fontWeight: "600" },
  date: { fontSize: 13, color: "#6B7280" },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#111827", marginTop: 4 },
  desc: { fontSize: 14, color: "#4B5563", marginTop: 4 },
  badges: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 },
  badge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { color: "#FFFFFF", fontSize: 12, fontWeight: "600" },
  mediaCount: { fontSize: 12, color: "#6B7280" },
  center: { alignItems: "center", marginTop: 40 },
  emptyText: { color: "#6B7280", fontSize: 15, textAlign: "center" },
  errorText: { color: "#DC2626", fontSize: 15, marginBottom: 8 },
  link: { color: "#2563EB", fontSize: 15, fontWeight: "600" },
});
