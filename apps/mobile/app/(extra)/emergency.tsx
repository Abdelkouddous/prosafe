import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
  closeEmergencyEvent,
  Drill,
  EmergencyEvent,
  EmergencyScenario,
  fetchActiveEvents,
  fetchDrills,
  fetchScenarios,
  triggerEmergency,
} from "@/services/emergencyApi";

/** Keeps digits, '+' and the first number of "14 / 1021" style values. */
const dialable = (phone: string) => phone.split(/[\/;,]/)[0].replace(/[^\d+]/g, "");

const confirmAsync = (title: string, message: string, okText: string, cancelText: string): Promise<boolean> => {
  if (Platform.OS === "web") {
    // eslint-disable-next-line no-alert
    return Promise.resolve(typeof window !== "undefined" ? window.confirm(`${title}\n${message}`) : false);
  }
  return new Promise((resolve) =>
    Alert.alert(title, message, [
      { text: cancelText, style: "cancel", onPress: () => resolve(false) },
      { text: okText, style: "destructive", onPress: () => resolve(true) },
    ])
  );
};

export default function EmergencyScreen() {
  const { user } = useAuth();
  const { t, isRTL, currentLanguage } = useLanguage();
  const { colors, fs } = useAppTheme();
  const isManager = user?.role === "admin" || user?.role === "sst_manager";

  const [events, setEvents] = useState<EmergencyEvent[] | null>(null);
  const [scenarios, setScenarios] = useState<EmergencyScenario[] | null>(null);
  const [drills, setDrills] = useState<Drill[] | null>(null);
  const [failed, setFailed] = useState({ events: false, scenarios: false, drills: false });
  const [refreshing, setRefreshing] = useState(false);
  const [detail, setDetail] = useState<EmergencyScenario | null>(null);
  const [triggerOpen, setTriggerOpen] = useState(false);
  const [closing, setClosing] = useState<number | null>(null);

  const load = useCallback(async () => {
    const [ev, sc, dr] = await Promise.allSettled([fetchActiveEvents(), fetchScenarios(), fetchDrills()]);
    if (ev.status === "fulfilled") setEvents(ev.value);
    if (sc.status === "fulfilled") setScenarios(sc.value);
    if (dr.status === "fulfilled") {
      setDrills(dr.value.filter((d) => d.status === "planned").sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt)));
    }
    setFailed({
      events: ev.status === "rejected",
      scenarios: sc.status === "rejected",
      drills: dr.status === "rejected",
    });
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

  const fmt = (d: string) => {
    const date = new Date(d);
    return isNaN(date.getTime())
      ? ""
      : date.toLocaleString(currentLanguage, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  const closeEvent = async (ev: EmergencyEvent) => {
    const ok = await confirmAsync(t("emergencyCloseEvent"), t("emergencyCloseConfirm"), t("p4Confirm"), t("p4Cancel"));
    if (!ok) return;
    setClosing(ev.id);
    try {
      await closeEmergencyEvent(ev.id);
      await load();
    } catch {
      Alert.alert(t("error"), t("emergencyCloseFailed"));
    } finally {
      setClosing(null);
    }
  };

  const call = (phone: string) => {
    const num = dialable(phone);
    if (num) Linking.openURL(`tel:${num}`).catch(() => {});
  };

  const back = () => (router.canGoBack() ? router.back() : router.replace("/(tabs)/home"));
  const errorLine = (key: keyof typeof failed) =>
    failed[key] ? (
      <TouchableOpacity onPress={load}>
        <Text style={{ color: colors.danger, fontSize: fs(13), marginBottom: 8 }}>
          {t("p4LoadFailed")} {t("p4Retry")}
        </Text>
      </TouchableOpacity>
    ) : null;
  const sectionTitle = (k: TranslationKey) => (
    <Text style={{ color: colors.text, fontSize: fs(17), fontWeight: "700", marginTop: 18, marginBottom: 8 }}>{t(k)}</Text>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, direction: isRTL ? "rtl" : "ltr" }}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TouchableOpacity onPress={back} accessibilityLabel={t("back")} style={{ padding: 6 }}>
          <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ color: colors.text, fontSize: fs(20), fontWeight: "700" }}>{t("emergencyTitle")}</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 12, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {(events ?? []).map((ev) => (
          <View key={ev.id} style={[styles.banner, { backgroundColor: colors.danger }]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Ionicons name="warning" size={26} color="#FFFFFF" />
              <Text style={{ color: "#FFFFFF", fontSize: fs(16), fontWeight: "800" }}>{t("emergencyActiveBanner")}</Text>
            </View>
            <Text style={{ color: "#FFFFFF", fontSize: fs(16), marginTop: 8 }}>{ev.message}</Text>
            <Text style={{ color: "#FFFFFF", fontSize: fs(13), marginTop: 6 }}>
              {[ev.zone, t("emergencyTriggeredAt").replace("{time}", fmt(ev.triggeredAt))].filter(Boolean).join(" - ")}
            </Text>
            {isManager && (
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => closeEvent(ev)}
                disabled={closing === ev.id}
                accessibilityRole="button"
              >
                {closing === ev.id ? (
                  <ActivityIndicator color={colors.danger} />
                ) : (
                  <Text style={{ color: colors.danger, fontWeight: "700", fontSize: fs(14) }}>{t("emergencyCloseEvent")}</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        ))}
        {errorLine("events")}

        {isManager && (
          <TouchableOpacity
            style={[styles.triggerBtn, { backgroundColor: colors.danger }]}
            onPress={() => setTriggerOpen(true)}
            accessibilityRole="button"
          >
            <Ionicons name="megaphone" size={20} color="#FFFFFF" />
            <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: fs(15) }}>{t("emergencyTrigger")}</Text>
          </TouchableOpacity>
        )}

        {sectionTitle("emergencyScenarios")}
        {errorLine("scenarios")}
        {scenarios === null && !failed.scenarios && <ActivityIndicator color={colors.primary} />}
        {scenarios?.length === 0 && (
          <Text style={{ color: colors.textSecondary, fontSize: fs(14) }}>{t("emergencyNoScenarios")}</Text>
        )}
        {(scenarios ?? []).map((s) => (
          <TouchableOpacity
            key={s.id}
            style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setDetail(s)}
          >
            <Ionicons name="alert-circle" size={26} color={colors.danger} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontSize: fs(15), fontWeight: "600" }}>{s.title}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: fs(12) }}>
                {s.steps.length} {t("emergencySteps").toLowerCase()}
              </Text>
            </View>
            <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        ))}

        {sectionTitle("emergencyDrills")}
        {errorLine("drills")}
        {drills === null && !failed.drills && <ActivityIndicator color={colors.primary} />}
        {drills?.length === 0 && (
          <Text style={{ color: colors.textSecondary, fontSize: fs(14) }}>{t("emergencyNoDrills")}</Text>
        )}
        {(drills ?? []).map((d) => (
          <View key={d.id} style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="calendar" size={24} color={colors.warning} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontSize: fs(15), fontWeight: "600" }}>{d.scenario?.title ?? t("emergencyDrills")}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: fs(12) }}>
                {[fmt(d.scheduledAt), d.zone].filter(Boolean).join(" - ")}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Scenario detail */}
      <Modal visible={!!detail} transparent animationType="slide" onRequestClose={() => setDetail(null)}>
        <View style={styles.overlay}>
          {detail && (
            <View style={[styles.sheet, { backgroundColor: colors.surface, direction: isRTL ? "rtl" : "ltr" }]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={{ flex: 1, color: colors.text, fontSize: fs(18), fontWeight: "700" }}>{detail.title}</Text>
                <TouchableOpacity onPress={() => setDetail(null)} accessibilityLabel={t("p4Close")}>
                  <Ionicons name="close" size={26} color={colors.text} />
                </TouchableOpacity>
              </View>
              <ScrollView style={{ maxHeight: 520 }}>
                {!!detail.assemblyPoint && (
                  <View style={[styles.assembly, { borderColor: colors.success }]}>
                    <Ionicons name="location" size={22} color={colors.success} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.textSecondary, fontSize: fs(12) }}>{t("emergencyAssembly")}</Text>
                      <Text style={{ color: colors.text, fontSize: fs(15), fontWeight: "700" }}>{detail.assemblyPoint}</Text>
                    </View>
                  </View>
                )}
                <Text style={[styles.subTitle, { color: colors.text, fontSize: fs(15) }]}>{t("emergencySteps")}</Text>
                {detail.steps.map((step, i) => (
                  <View key={i} style={{ flexDirection: "row", gap: 10, marginBottom: 8 }}>
                    <View style={[styles.stepNum, { backgroundColor: colors.danger }]}>
                      <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: fs(13) }}>{i + 1}</Text>
                    </View>
                    <Text style={{ flex: 1, color: colors.text, fontSize: fs(15) }}>{step}</Text>
                  </View>
                ))}
                {detail.contacts.length > 0 && (
                  <Text style={[styles.subTitle, { color: colors.text, fontSize: fs(15) }]}>{t("emergencyContacts")}</Text>
                )}
                {detail.contacts.map((c, i) => (
                  <View key={i} style={[styles.contact, { borderColor: colors.border }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.text, fontSize: fs(15), fontWeight: "600" }}>{c.name}</Text>
                      <Text style={{ color: colors.textSecondary, fontSize: fs(12) }}>
                        {[c.role, c.phone].filter(Boolean).join(" - ")}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.callBtn, { backgroundColor: colors.success }]}
                      onPress={() => call(c.phone)}
                      accessibilityLabel={`${t("emergencyCall")} ${c.name}`}
                    >
                      <Ionicons name="call" size={18} color="#FFFFFF" />
                      <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: fs(13) }}>{t("emergencyCall")}</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </Modal>

      <TriggerModal
        visible={triggerOpen}
        scenarios={scenarios ?? []}
        onClose={() => setTriggerOpen(false)}
        onDone={() => {
          setTriggerOpen(false);
          load();
        }}
      />
    </View>
  );
}

function TriggerModal({
  visible,
  scenarios,
  onClose,
  onDone,
}: {
  visible: boolean;
  scenarios: EmergencyScenario[];
  onClose: () => void;
  onDone: () => void;
}) {
  const { t, isRTL } = useLanguage();
  const { colors, fs } = useAppTheme();
  const [scenarioId, setScenarioId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [zone, setZone] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!message.trim()) {
      setError(t("emergencyTriggerFill"));
      return;
    }
    const ok = await confirmAsync(t("emergencyTriggerConfirmTitle"), t("emergencyTriggerConfirmMessage"), t("emergencyTriggerSend"), t("p4Cancel"));
    if (!ok) return;
    setSending(true);
    setError(null);
    try {
      await triggerEmergency({
        scenarioId: scenarioId ?? undefined,
        message: message.trim(),
        zone: zone.trim() || undefined,
      });
      setMessage("");
      setZone("");
      setScenarioId(null);
      onDone();
    } catch {
      setError(t("emergencyTriggerFailed"));
    } finally {
      setSending(false);
    }
  };

  const align = { textAlign: isRTL ? ("right" as const) : ("left" as const) };
  const inputStyle = [styles.input, align, { color: colors.text, borderColor: colors.border, fontSize: fs(15) }];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={[styles.sheet, { backgroundColor: colors.surface, direction: isRTL ? "rtl" : "ltr" }]}>
          <Text style={{ color: colors.danger, fontSize: fs(18), fontWeight: "800", marginBottom: 10 }}>{t("emergencyTrigger")}</Text>
          <ScrollView style={{ maxHeight: 460 }} keyboardShouldPersistTaps="handled">
            <Text style={{ color: colors.text, fontSize: fs(14), fontWeight: "600", marginBottom: 6 }}>{t("emergencyTriggerScenario")}</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
              {scenarios.map((s) => {
                const active = scenarioId === s.id;
                return (
                  <TouchableOpacity
                    key={s.id}
                    onPress={() => setScenarioId(active ? null : s.id)}
                    accessibilityState={{ selected: active }}
                    style={[styles.pill, { borderColor: active ? colors.danger : colors.border, backgroundColor: active ? colors.danger : colors.surface }]}
                  >
                    <Text style={{ color: active ? "#FFFFFF" : colors.text, fontSize: fs(13) }}>{s.title}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={{ color: colors.text, fontSize: fs(14), fontWeight: "600", marginBottom: 6 }}>{t("emergencyTriggerMessage")}</Text>
            <TextInput
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={1000}
              style={[inputStyle, { height: 90, textAlignVertical: "top" }]}
              placeholderTextColor={colors.textSecondary}
            />
            <Text style={{ color: colors.text, fontSize: fs(14), fontWeight: "600", marginBottom: 6 }}>{t("emergencyTriggerZone")}</Text>
            <TextInput value={zone} onChangeText={setZone} maxLength={100} style={inputStyle} placeholderTextColor={colors.textSecondary} />
          </ScrollView>
          {!!error && <Text style={{ color: colors.danger, fontSize: fs(13), marginBottom: 8 }}>{error}</Text>}
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity style={[styles.btn, { borderColor: colors.border, borderWidth: 1 }]} onPress={onClose}>
              <Text style={{ color: colors.text, fontSize: fs(15) }}>{t("p4Cancel")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.danger, opacity: sending ? 0.6 : 1 }]}
              onPress={submit}
              disabled={sending}
            >
              {sending ? <ActivityIndicator color="#FFFFFF" /> : <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: fs(15) }}>{t("emergencyTriggerSend")}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 44, paddingBottom: 8, paddingHorizontal: 8, flexDirection: "row", alignItems: "center", gap: 6, borderBottomWidth: 1 },
  banner: { borderRadius: 12, padding: 14, marginBottom: 12 },
  closeBtn: { backgroundColor: "#FFFFFF", borderRadius: 8, paddingVertical: 10, alignItems: "center", marginTop: 12 },
  triggerBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, paddingVertical: 14 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 8 },
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" },
  sheet: { borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, paddingBottom: 28 },
  assembly: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 2, borderRadius: 10, padding: 10, marginTop: 12 },
  subTitle: { fontWeight: "700", marginTop: 16, marginBottom: 8 },
  stepNum: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  contact: { flexDirection: "row", alignItems: "center", gap: 10, borderBottomWidth: 1, paddingVertical: 10 },
  callBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  input: { borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 12 },
  pill: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  btn: { flex: 1, borderRadius: 8, paddingVertical: 12, alignItems: "center", justifyContent: "center" },
});
