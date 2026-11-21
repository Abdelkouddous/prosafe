import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useLanguage } from "@/contexts/LanguageContext";
import { MediaViewer } from "@/components/MediaViewer";
import { SEVERITY_COLORS, STATUS_COLORS } from "@/constants/incidentUi";
import { API_BASE_URL } from "@/services/api";
import { storage } from "@/services/storage";
import {
  IncidentDetail,
  IncidentMedia,
  fetchIncident,
} from "@/services/incidentApi";

const mapsUrl = (lat: number, lng: number) => {
  if (Platform.OS === "ios") return `maps:0,0?q=${lat},${lng}`;
  if (Platform.OS === "android") return `geo:${lat},${lng}?q=${lat},${lng}`;
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
};

export default function IncidentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, isRTL, currentLanguage } = useLanguage();

  const [incident, setIncident] = useState<IncidentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<"notFound" | "failed" | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [viewing, setViewing] = useState<IncidentMedia | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setIncident(await fetchIncident(id));
    } catch (e: any) {
      setError(e?.response?.status === 404 ? "notFound" : "failed");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
    storage.getToken().then(setToken).catch(() => {});
  }, [load]);

  const locale = currentLanguage;
  const fmt = (d?: string | null) => (d ? new Date(d).toLocaleString(locale) : "-");
  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
  const fileUri = (m: IncidentMedia) => `${API_BASE_URL}/files/${m.id}`;

  const lat = incident?.geoLatitude != null ? Number(incident.geoLatitude) : NaN;
  const lng = incident?.geoLongitude != null ? Number(incident.geoLongitude) : NaN;
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);

  const back = () => (router.canGoBack() ? router.back() : router.replace("/(tabs)/get-incidents"));

  return (
    <View style={[styles.container, { direction: isRTL ? "rtl" : "ltr" }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={back} accessibilityRole="button" style={styles.backBtn}>
          <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>{t("incidentDetails")}</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#2563EB" />
      ) : error || !incident ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>
            {error === "notFound" ? t("notFound") : t("loadFailed")}
          </Text>
          {error !== "notFound" && (
            <TouchableOpacity onPress={load}>
              <Text style={styles.link}>{t("retry")}</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.code}>{incident.incidentId}</Text>
          <Text style={styles.title}>{t(`type_${incident.type}` as const)}</Text>
          <View style={styles.badges}>
            <View style={[styles.badge, { backgroundColor: SEVERITY_COLORS[incident.severity] }]}>
              <Text style={styles.badgeText}>{t(`severity_${incident.severity}` as const)}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: STATUS_COLORS[incident.status] }]}>
              <Text style={styles.badgeText}>{t(`status_${incident.status}` as const)}</Text>
            </View>
          </View>

          {!!incident.description && <Text style={styles.body}>{incident.description}</Text>}

          <Row label={t("reportedOn")} value={fmt(incident.timestamp ?? incident.createdAt)} />
          {!!incident.resolvedAt && <Row label={t("resolvedOn")} value={fmt(incident.resolvedAt)} />}
          {!!incident.zone && <Row label={t("zoneLabel")} value={incident.zone} />}
          {!!incident.department && <Row label={t("departmentLabel")} value={incident.department} />}
          {!!incident.notes && (
            <Section title={t("notes")}>
              <Text style={styles.body}>{incident.notes}</Text>
            </Section>
          )}

          <Section title={t("media")}>
            {incident.media?.length ? (
              <View style={styles.mediaRow}>
                {incident.media.map((m) => (
                  <TouchableOpacity key={String(m.id)} onPress={() => setViewing(m)}>
                    {m.kind === "video" ? (
                      <View style={[styles.thumb, styles.videoThumb]}>
                        <Ionicons name="play-circle" size={36} color="#FFFFFF" />
                      </View>
                    ) : (
                      <Image
                        source={{ uri: fileUri(m), headers }}
                        style={styles.thumb}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={styles.muted}>{t("noMedia")}</Text>
            )}
          </Section>

          <Section title={t("location")}>
            {hasCoords || incident.manualAddress ? (
              <>
                {hasCoords && (
                  <Row label={t("coordinates")} value={`${lat.toFixed(5)}, ${lng.toFixed(5)}`} />
                )}
                {!!incident.manualAddress && (
                  <Row label={t("address")} value={incident.manualAddress} />
                )}
                {hasCoords && (
                  <TouchableOpacity
                    style={styles.mapBtn}
                    onPress={() => Linking.openURL(mapsUrl(lat, lng)).catch(() => {})}
                  >
                    <Ionicons name="map" size={18} color="#FFFFFF" />
                    <Text style={styles.mapBtnText}>{t("openInMaps")}</Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <Text style={styles.muted}>{t("noLocation")}</Text>
            )}
          </Section>

          <Section title={t("history")}>
            {incident.history?.length ? (
              incident.history.map((h, i) => (
                <View key={String(h.id ?? i)} style={styles.timelineItem}>
                  <View style={[styles.dot, { backgroundColor: STATUS_COLORS[h.toStatus] ?? "#6B7280" }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.timelineTitle}>
                      {h.fromStatus ? `${t(`status_${h.fromStatus}` as const)} → ` : ""}
                      {t(`status_${h.toStatus}` as const)}
                    </Text>
                    <Text style={styles.muted}>
                      {fmt(h.changedAt)}
                      {h.changedBy
                        ? ` ${t("by")} ${[h.changedBy.firstName, h.changedBy.lastName].filter(Boolean).join(" ")}`
                        : ""}
                    </Text>
                    {!!h.comment && <Text style={styles.body}>{h.comment}</Text>}
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.muted}>{t("noHistory")}</Text>
            )}
          </Section>
        </ScrollView>
      )}

      <MediaViewer
        media={viewing}
        uri={viewing ? fileUri(viewing) : ""}
        headers={headers}
        onClose={() => setViewing(null)}
      />
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backBtn: { padding: 6, marginRight: 8 },
  topTitle: { fontSize: 18, fontWeight: "700", color: "#1F2937" },
  content: { padding: 16, paddingBottom: 60 },
  center: { alignItems: "center", marginTop: 60 },
  errorText: { color: "#DC2626", fontSize: 15, marginBottom: 8 },
  link: { color: "#2563EB", fontSize: 15, fontWeight: "600" },
  code: { fontSize: 13, color: "#6B7280", fontWeight: "600" },
  title: { fontSize: 22, fontWeight: "bold", color: "#111827", marginTop: 2 },
  badges: { flexDirection: "row", gap: 8, marginVertical: 10 },
  badge: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 5 },
  badgeText: { color: "#FFFFFF", fontSize: 13, fontWeight: "600" },
  body: { fontSize: 15, color: "#374151", marginVertical: 6 },
  muted: { fontSize: 13, color: "#6B7280" },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, gap: 12 },
  rowLabel: { fontSize: 14, color: "#6B7280" },
  rowValue: { fontSize: 14, color: "#111827", flexShrink: 1, fontWeight: "500" },
  section: { backgroundColor: "#FFFFFF", borderRadius: 10, padding: 14, marginTop: 14 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1F2937", marginBottom: 8 },
  mediaRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  thumb: { width: 96, height: 96, borderRadius: 8, backgroundColor: "#E5E7EB" },
  videoThumb: { backgroundColor: "#374151", alignItems: "center", justifyContent: "center" },
  mapBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#2563EB",
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
  },
  mapBtnText: { color: "#FFFFFF", fontWeight: "600", fontSize: 15 },
  timelineItem: { flexDirection: "row", gap: 10, paddingVertical: 8 },
  dot: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
  timelineTitle: { fontSize: 15, fontWeight: "600", color: "#111827" },
});
