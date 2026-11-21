import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";
import { Chip } from "@/components/Chip";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import type { TranslationKey } from "@/constants/Languages";
import {
  MyEnrollment,
  Training,
  TrainingSession,
  cancelEnrollment,
  enrollInSession,
  fetchMyTrainings,
  fetchTrainingCatalogue,
  fetchUpcomingSessions,
} from "@/services/trainingApi";

type Segment = "catalogue" | "sessions" | "mine";

const notify = (msg: string) => {
  if (Platform.OS === "android") ToastAndroid.show(msg, ToastAndroid.SHORT);
  else Alert.alert(msg);
};

const STATUS_KEYS: Record<string, TranslationKey> = {
  registered: "statusRegistered",
  attended: "statusAttended",
  passed: "statusPassed",
  failed: "statusFailed",
  cancelled: "statusCancelled",
};

export default function TrainingsScreen() {
  const { t, isRTL, currentLanguage } = useLanguage();
  const { user } = useAuth();
  const [segment, setSegment] = useState<Segment>("catalogue");
  const [catalogue, setCatalogue] = useState<Training[]>([]);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [mine, setMine] = useState<MyEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errors, setErrors] = useState<Record<Segment, boolean>>({
    catalogue: false,
    sessions: false,
    mine: false,
  });
  const [busyId, setBusyId] = useState<number | null>(null);

  const loadSegment = useCallback(async (seg: Segment) => {
    try {
      if (seg === "catalogue") setCatalogue(await fetchTrainingCatalogue());
      else if (seg === "sessions") setSessions(await fetchUpcomingSessions());
      else setMine(await fetchMyTrainings());
      setErrors((e) => ({ ...e, [seg]: false }));
    } catch {
      setErrors((e) => ({ ...e, [seg]: true }));
    }
  }, []);

  const loadAll = useCallback(async () => {
    await Promise.all(
      (["catalogue", "sessions", "mine"] as Segment[]).map(loadSegment)
    );
    setLoading(false);
    setRefreshing(false);
  }, [loadSegment]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const fmtDate = (iso: string | null | undefined) =>
    iso ? new Date(iso).toLocaleDateString(currentLanguage) : "";
  const fmtDateTime = (iso: string) =>
    new Date(iso).toLocaleString(currentLanguage);

  const toggleEnroll = async (s: TrainingSession) => {
    setBusyId(s.id);
    try {
      if (s.enrolledByMe) {
        await cancelEnrollment(s.id);
        notify(t("unenrolledOk"));
      } else {
        await enrollInSession(s.id);
        notify(t("enrolledOk"));
      }
      await Promise.all([loadSegment("sessions"), loadSegment("mine")]);
    } catch {
      notify(t("enrollFailed"));
      loadSegment("sessions");
    } finally {
      setBusyId(null);
    }
  };

  const meta = (hours: number | null | undefined, months: number | null | undefined) => {
    const parts: string[] = [];
    if (hours) parts.push(`${t("durationHours")}: ${hours} ${t("hoursShort")}`);
    if (months) parts.push(`${t("validityMonths")}: ${months} ${t("monthsShort")}`);
    return parts.join("  ·  ");
  };

  const renderCatalogue = ({ item }: { item: Training }) => {
    const mandatory = !!user && item.mandatoryForRoles?.includes(user.role);
    return (
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.title}>{item.title}</Text>
          {mandatory && (
            <View style={[styles.badge, { backgroundColor: "#EA580C" }]}>
              <Text style={styles.badgeText}>{t("mandatory")}</Text>
            </View>
          )}
        </View>
        {!!item.description && <Text style={styles.body}>{item.description}</Text>}
        <Text style={styles.meta}>{meta(item.durationHours, item.validityMonths)}</Text>
      </View>
    );
  };

  const renderSession = ({ item }: { item: TrainingSession }) => {
    const left =
      item.capacity == null ? null : Math.max(0, item.capacity - item.enrolledCount);
    const full = left === 0 && !item.enrolledByMe;
    const busy = busyId === item.id;
    return (
      <View style={styles.card}>
        <Text style={styles.title}>{item.training?.title ?? `#${item.trainingId}`}</Text>
        <Text style={styles.body}>{fmtDateTime(item.startAt)}</Text>
        {!!item.location && <Text style={styles.meta}>{item.location}</Text>}
        {!!item.trainer && (
          <Text style={styles.meta}>
            {t("trainerLabel")}: {item.trainer}
          </Text>
        )}
        <Text style={[styles.meta, full && { color: "#DC2626" }]}>
          {left == null
            ? t("unlimitedPlaces")
            : full
              ? t("full")
              : `${left} ${t("placesLeft")}`}
        </Text>
        <TouchableOpacity
          disabled={full || busy}
          onPress={() => toggleEnroll(item)}
          style={[
            styles.btn,
            { backgroundColor: item.enrolledByMe ? "#DC2626" : "#16A34A" },
            (full || busy) && { opacity: 0.5 },
          ]}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>
              {item.enrolledByMe ? t("unenroll") : t("enroll")}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const renderMine = ({ item }: { item: MyEnrollment }) => {
    const tr = item.session?.training;
    const pct = Math.max(0, Math.min(100, item.progress ?? 0));
    const statusColor =
      item.status === "passed" ? "#16A34A" : item.status === "failed" ? "#DC2626" : "#6B7280";
    return (
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.title}>{tr?.title ?? "-"}</Text>
          <View style={[styles.badge, { backgroundColor: statusColor }]}>
            <Text style={styles.badgeText}>{t(STATUS_KEYS[item.status] ?? "statusRegistered")}</Text>
          </View>
        </View>
        {!!item.session?.startAt && <Text style={styles.meta}>{fmtDateTime(item.session.startAt)}</Text>}
        {item.score != null && (
          <Text style={styles.body}>
            {t("scoreLabel")}: {item.score}
          </Text>
        )}
        <Text style={styles.meta}>
          {t("progressLabel")}: {pct}%
        </Text>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${pct}%`, backgroundColor: pct >= 100 ? "#16A34A" : "#2563EB" }]} />
        </View>
        {!!item.expiresAt && (
          <Text
            style={[
              styles.body,
              { fontWeight: "600", color: item.isExpired ? "#DC2626" : item.expiresSoon ? "#EA580C" : "#16A34A" },
            ]}
          >
            {item.isExpired ? t("expired") : item.expiresSoon ? t("expiresSoonBadge") : t("expiresAtLabel")}
            {": "}
            {fmtDate(item.expiresAt)}
          </Text>
        )}
      </View>
    );
  };

  const common = {
    contentContainerStyle: styles.list,
    refreshControl: (
      <RefreshControl
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          loadAll();
        }}
      />
    ),
  };

  const errorBox = (
    <View style={styles.center}>
      <Text style={styles.errorText}>{t("loadFailed")}</Text>
      <TouchableOpacity style={[styles.btn, { backgroundColor: "#2563EB" }]} onPress={() => loadSegment(segment)}>
        <Text style={styles.btnText}>{t("retry")}</Text>
      </TouchableOpacity>
    </View>
  );

  const body = () => {
    if (loading) return <ActivityIndicator style={{ marginTop: 32 }} size="large" color="#2563EB" />;
    if (errors[segment]) return errorBox;
    if (segment === "catalogue")
      return (
        <FlatList {...common} data={catalogue} keyExtractor={(i) => String(i.id)} renderItem={renderCatalogue}
          ListEmptyComponent={<Text style={styles.empty}>{t("noTrainings")}</Text>} />
      );
    if (segment === "sessions")
      return (
        <FlatList {...common} data={sessions} keyExtractor={(i) => String(i.id)} renderItem={renderSession}
          ListEmptyComponent={<Text style={styles.empty}>{t("noSessions")}</Text>} />
      );
    return (
      <FlatList {...common} data={mine} keyExtractor={(i) => String(i.id)} renderItem={renderMine}
        ListEmptyComponent={<Text style={styles.empty}>{t("noMyTrainings")}</Text>} />
    );
  };

  return (
    <View style={[styles.container, { direction: isRTL ? "rtl" : "ltr" }]}>
      <Text style={styles.header}>{t("trainingsTitle")}</Text>
      <View style={styles.segments}>
        <Chip label={t("segCatalogue")} selected={segment === "catalogue"} onPress={() => setSegment("catalogue")} />
        <Chip label={t("segSessions")} selected={segment === "sessions"} onPress={() => setSegment("sessions")} />
        <Chip label={t("segMine")} selected={segment === "mine"} onPress={() => setSegment("mine")} />
      </View>
      {body()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: { fontSize: 22, fontWeight: "700", color: "#1F2937", paddingTop: 56, paddingHorizontal: 16 },
  segments: { flexDirection: "row", flexWrap: "wrap", gap: 8, padding: 12 },
  list: { padding: 12, paddingBottom: 40 },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: "#E5E7EB" },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  title: { flex: 1, fontSize: 16, fontWeight: "700", color: "#111827" },
  body: { fontSize: 14, color: "#374151", marginTop: 4 },
  meta: { fontSize: 13, color: "#6B7280", marginTop: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  btn: { marginTop: 12, padding: 12, borderRadius: 10, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  track: { height: 8, backgroundColor: "#E5E7EB", borderRadius: 4, marginTop: 4, marginBottom: 6, overflow: "hidden" },
  fill: { height: 8, borderRadius: 4 },
  center: { alignItems: "center", marginTop: 40, padding: 16 },
  errorText: { color: "#DC2626", fontSize: 16 },
  empty: { textAlign: "center", color: "#6B7280", marginTop: 40, fontSize: 16 },
});
