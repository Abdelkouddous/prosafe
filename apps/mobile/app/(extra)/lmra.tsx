import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppTheme } from "@/contexts/AccessibilityContext";
import { TranslationKey } from "@/constants/Languages";
import { PHASE4_TRANSLATIONS } from "@/constants/Phase4Translations";
import { RISK_HC_LEVEL_COLORS, RISK_LEVEL_COLORS } from "@/constants/riskUi";
import { createLmra, fetchMyLmra, LmraAssessment, RiskLevel } from "@/services/risksApi";

type HazardId = "slip" | "electrical" | "chemical" | "machinery" | "height" | "lifting" | "noise" | "confined";

const HAZARDS: { id: HazardId; level: RiskLevel }[] = [
  { id: "slip", level: "medium" },
  { id: "electrical", level: "high" },
  { id: "chemical", level: "high" },
  { id: "machinery", level: "high" },
  { id: "height", level: "critical" },
  { id: "lifting", level: "medium" },
  { id: "noise", level: "medium" },
  { id: "confined", level: "critical" },
];
const LEVEL_ORDER: RiskLevel[] = ["low", "medium", "high", "critical"];

interface HazardState {
  present: boolean;
  controlled: boolean;
}
const emptyHazards = (): Record<HazardId, HazardState> =>
  Object.fromEntries(HAZARDS.map((h) => [h.id, { present: false, controlled: false }])) as Record<HazardId, HazardState>;

const hazardKey = (id: HazardId) => `lmraHazard_${id}` as TranslationKey;

const LMRA = () => {
  const { t, isRTL, currentLanguage } = useLanguage();
  const { colors, fs, highContrast } = useAppTheme();
  const levelColors = highContrast ? RISK_HC_LEVEL_COLORS : RISK_LEVEL_COLORS;

  const [mode, setMode] = useState<"form" | "history">("form");
  const [step, setStep] = useState(1);
  const [task, setTask] = useState("");
  const [location, setLocation] = useState("");
  const [hazards, setHazards] = useState(emptyHazards);
  const [comments, setComments] = useState("");
  const [decision, setDecision] = useState<"go" | "stop">("go");
  const [confirmed, setConfirmed] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LmraAssessment | null>(null);

  const [history, setHistory] = useState<LmraAssessment[] | null>(null);
  const [historyFailed, setHistoryFailed] = useState(false);

  const loadHistory = useCallback(async () => {
    setHistoryFailed(false);
    try {
      setHistory(await fetchMyLmra());
    } catch {
      setHistoryFailed(true);
    }
  }, []);
  useEffect(() => {
    if (mode === "history") loadHistory();
  }, [mode, loadHistory]);

  const present = HAZARDS.filter((h) => hazards[h.id].present);
  const overall: RiskLevel = present.reduce<RiskLevel>(
    (acc, h) => (LEVEL_ORDER.indexOf(h.level) > LEVEL_ORDER.indexOf(acc) ? h.level : acc),
    "low"
  );
  const uncontrolled = present.filter((h) => !hazards[h.id].controlled).length;

  const reset = () => {
    setStep(1);
    setTask("");
    setLocation("");
    setHazards(emptyHazards());
    setComments("");
    setDecision("go");
    setConfirmed(false);
    setResult(null);
    setError(null);
  };

  const next = () => {
    if (step === 1 && (!task.trim() || !location.trim())) {
      setError(t("lmraIncompleteMessage"));
      return;
    }
    setError(null);
    setStep(step + 1);
  };

  const submit = async () => {
    setSending(true);
    setError(null);
    try {
      // Labels are sent in French so the same hazard is deduplicated across app languages.
      const fr = PHASE4_TRANSLATIONS.fr as Record<string, string>;
      const res = await createLmra({
        task: task.trim(),
        location: location.trim(),
        hazards: HAZARDS.map((h) => ({
          label: fr[hazardKey(h.id)],
          present: hazards[h.id].present,
          controlled: hazards[h.id].present ? hazards[h.id].controlled : true,
        })),
        decision,
        comments: comments.trim() || undefined,
      });
      setResult(res);
    } catch {
      setError(t("lmraSubmitFailed"));
    } finally {
      setSending(false);
    }
  };

  const back = () => (router.canGoBack() ? router.back() : router.replace("/(tabs)/home"));
  const align = { textAlign: isRTL ? ("right" as const) : ("left" as const) };
  const inputStyle = [styles.input, align, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface, fontSize: fs(15) }];
  const labelStyle = { color: colors.text, fontSize: fs(15), fontWeight: "600" as const, marginBottom: 6 };

  const Badge = ({ level }: { level: RiskLevel }) => (
    <View style={[styles.badge, { backgroundColor: levelColors[level] }]}>
      <Text style={{ color: "#FFFFFF", fontSize: fs(11), fontWeight: "700" }}>{t(`risksLevel_${level}` as TranslationKey)}</Text>
    </View>
  );

  const header = (
    <View style={[styles.header, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <TouchableOpacity onPress={back} accessibilityLabel={t("back")} style={{ padding: 8 }}>
        <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={24} color={colors.text} />
      </TouchableOpacity>
      <Text style={{ color: colors.text, fontSize: fs(18), fontWeight: "700" }}>{t("lmraTitle")}</Text>
      <TouchableOpacity
        onPress={() => setMode(mode === "form" ? "history" : "form")}
        accessibilityRole="button"
        style={{ padding: 8 }}
      >
        <Text style={{ color: colors.primary, fontSize: fs(13), fontWeight: "600" }}>
          {mode === "form" ? t("lmraHistory") : t("lmraForm")}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const container = { flex: 1, backgroundColor: colors.background, direction: isRTL ? ("rtl" as const) : ("ltr" as const) };

  if (mode === "history") {
    return (
      <View style={container}>
        {header}
        <FlatList
          data={history ?? []}
          keyExtractor={(l) => String(l.id)}
          contentContainerStyle={{ padding: 12, flexGrow: 1 }}
          ListHeaderComponent={
            historyFailed ? (
              <TouchableOpacity onPress={loadHistory}>
                <Text style={{ color: colors.danger, fontSize: fs(13), marginBottom: 8 }}>
                  {t("p4LoadFailed")} {t("p4Retry")}
                </Text>
              </TouchableOpacity>
            ) : null
          }
          ListEmptyComponent={
            history === null && !historyFailed ? (
              <ActivityIndicator style={{ marginTop: 30 }} color={colors.primary} size="large" />
            ) : historyFailed ? null : (
              <Text style={{ color: colors.textSecondary, textAlign: "center", marginTop: 40, fontSize: fs(15) }}>
                {t("lmraHistoryEmpty")}
              </Text>
            )
          }
          renderItem={({ item }) => {
            const stop = item.decision === "stop";
            const open = item.hazards.filter((h) => h.present && !h.controlled).length;
            return (
              <View style={[styles.histRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name={stop ? "hand-left" : "checkmark-circle"} size={26} color={stop ? colors.danger : colors.success} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontSize: fs(15), fontWeight: "600" }} numberOfLines={2}>
                    {item.task}
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: fs(12) }}>
                    {[item.location, new Date(item.createdAt).toLocaleString(currentLanguage)].filter(Boolean).join(" - ")}
                  </Text>
                  <Text style={{ color: open ? colors.warning : colors.success, fontSize: fs(12), marginTop: 2 }}>
                    {stop ? t("lmraStop") : t("lmraGo")}
                    {open ? ` - ${t("lmraUncontrolled")}: ${open}` : ""}
                  </Text>
                </View>
              </View>
            );
          }}
        />
      </View>
    );
  }

  if (result) {
    return (
      <View style={container}>
        {header}
        <View style={styles.successBox}>
          <Ionicons name="checkmark-circle" size={72} color={colors.success} />
          <Text style={{ color: colors.text, fontSize: fs(20), fontWeight: "700", marginTop: 10 }}>{t("lmraSuccessTitle")}</Text>
          <Text style={{ color: colors.textSecondary, fontSize: fs(14), marginTop: 6, textAlign: "center" }}>
            {t("lmraSuccessMessage")}
          </Text>
          {result.riskIds.length > 0 && (
            <Text style={{ color: colors.warning, fontSize: fs(14), marginTop: 10, textAlign: "center" }}>
              {t("lmraProposedNote").replace("{n}", String(result.riskIds.length))}
            </Text>
          )}
          {result.decision === "stop" && (
            <Text style={{ color: colors.danger, fontSize: fs(14), marginTop: 6, textAlign: "center" }}>{t("lmraStopNote")}</Text>
          )}
          <View style={{ flexDirection: "row", gap: 10, marginTop: 24 }}>
            <TouchableOpacity style={[styles.btnOutline, { borderColor: colors.primary }]} onPress={reset}>
              <Text style={{ color: colors.primary, fontWeight: "600", fontSize: fs(15) }}>{t("lmraNew")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btnFill, { backgroundColor: colors.primary }]} onPress={back}>
              <Text style={{ color: "#FFFFFF", fontWeight: "600", fontSize: fs(15) }}>{t("lmraDone")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  const stepLabels = [t("lmraStepTask"), t("lmraStepHazards"), t("lmraStepSummary")];
  const canSubmit = confirmed && !sending;

  return (
    <View style={container}>
      {header}
      <View style={[styles.progress, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {[1, 2, 3].map((s) => (
          <View key={s} style={{ alignItems: "center", marginHorizontal: 20 }}>
            <View style={[styles.circle, { backgroundColor: step >= s ? colors.primary : colors.border }]}>
              <Text style={{ color: step >= s ? "#FFFFFF" : colors.textSecondary, fontWeight: "700", fontSize: fs(15) }}>{s}</Text>
            </View>
            <Text style={{ color: colors.textSecondary, fontSize: fs(12), marginTop: 4 }}>{stepLabels[s - 1]}</Text>
          </View>
        ))}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        {step === 1 && (
          <View>
            <Text style={[labelStyle, { fontSize: fs(20), fontWeight: "700" }]}>{t("lmraTaskInfo")}</Text>
            <Text style={labelStyle}>{t("lmraTaskLabel")}</Text>
            <TextInput
              style={[inputStyle, { minHeight: 80, textAlignVertical: "top" }]}
              placeholder={t("lmraTaskPlaceholder")}
              placeholderTextColor={colors.textSecondary}
              value={task}
              onChangeText={setTask}
              maxLength={200}
              multiline
            />
            <Text style={labelStyle}>{t("lmraLocationLabel")}</Text>
            <TextInput
              style={inputStyle}
              placeholder={t("lmraLocationPlaceholder")}
              placeholderTextColor={colors.textSecondary}
              value={location}
              onChangeText={setLocation}
              maxLength={200}
            />
          </View>
        )}

        {step === 2 && (
          <View>
            <Text style={[labelStyle, { fontSize: fs(20), fontWeight: "700" }]}>{t("lmraHazards")}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: fs(14), marginBottom: 12 }}>{t("lmraSelectHazards")}</Text>
            {HAZARDS.map((h) => {
              const st = hazards[h.id];
              const set = (patch: Partial<HazardState>) => setHazards((p) => ({ ...p, [h.id]: { ...p[h.id], ...patch } }));
              return (
                <View
                  key={h.id}
                  style={[styles.hazard, { backgroundColor: colors.surface, borderColor: st.present ? colors.primary : colors.border }]}
                >
                  <TouchableOpacity
                    style={styles.hazardHead}
                    onPress={() => set({ present: !st.present, controlled: false })}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: st.present }}
                  >
                    <Ionicons name={st.present ? "checkbox" : "square-outline"} size={24} color={st.present ? colors.primary : colors.textSecondary} />
                    <Text style={{ flex: 1, color: colors.text, fontSize: fs(15), fontWeight: "600" }}>{t(hazardKey(h.id))}</Text>
                    <Badge level={h.level} />
                  </TouchableOpacity>
                  {st.present && (
                    <TouchableOpacity
                      style={[styles.hazardHead, { marginTop: 8 }]}
                      onPress={() => set({ controlled: !st.controlled })}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: st.controlled }}
                    >
                      <Ionicons name={st.controlled ? "shield-checkmark" : "shield-outline"} size={22} color={st.controlled ? colors.success : colors.danger} />
                      <Text style={{ color: st.controlled ? colors.success : colors.danger, fontSize: fs(14), fontWeight: "600" }}>
                        {st.controlled ? t("lmraControlled") : t("lmraUncontrolled")}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {step === 3 && (
          <View>
            <Text style={[labelStyle, { fontSize: fs(20), fontWeight: "700" }]}>{t("lmraSummary")}</Text>
            <View style={[styles.summary, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ color: colors.text, fontSize: fs(16), fontWeight: "700" }}>{t("lmraOverallRisk")}</Text>
                <Badge level={overall} />
              </View>
              <Text style={{ color: colors.textSecondary, fontSize: fs(14), marginTop: 10, fontWeight: "600" }}>
                {t("lmraSelectedHazards").replace("{n}", String(present.length))}
              </Text>
              {present.map((h) => (
                <View key={h.id} style={styles.summaryRow}>
                  <Text style={{ flex: 1, color: colors.text, fontSize: fs(14) }}>{t(hazardKey(h.id))}</Text>
                  <Text style={{ color: hazards[h.id].controlled ? colors.success : colors.danger, fontSize: fs(12), fontWeight: "700" }}>
                    {hazards[h.id].controlled ? t("lmraControlled") : t("lmraUncontrolled")}
                  </Text>
                </View>
              ))}
            </View>

            <Text style={labelStyle}>{t("lmraDecision")}</Text>
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
              {(["go", "stop"] as const).map((d) => {
                const active = decision === d;
                const c = d === "go" ? colors.success : colors.danger;
                return (
                  <TouchableOpacity
                    key={d}
                    onPress={() => setDecision(d)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    style={[styles.decision, { borderColor: c, backgroundColor: active ? c : colors.surface }]}
                  >
                    <Text style={{ color: active ? "#FFFFFF" : c, fontWeight: "700", fontSize: fs(14), textAlign: "center" }}>
                      {d === "go" ? t("lmraGo") : t("lmraStop")}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {uncontrolled > 0 && decision === "go" && (
              <Text style={{ color: colors.warning, fontSize: fs(13), marginBottom: 12 }}>
                {t("lmraProposedNote").replace("{n}", String(uncontrolled))}
              </Text>
            )}

            <Text style={labelStyle}>{t("lmraComments")}</Text>
            <TextInput
              style={[inputStyle, { minHeight: 80, textAlignVertical: "top" }]}
              placeholder={t("lmraCommentsPlaceholder")}
              placeholderTextColor={colors.textSecondary}
              value={comments}
              onChangeText={setComments}
              multiline
            />
            <TouchableOpacity
              style={[styles.confirm, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => setConfirmed(!confirmed)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: confirmed }}
            >
              <Ionicons name={confirmed ? "checkbox" : "square-outline"} size={24} color={confirmed ? colors.primary : colors.textSecondary} />
              <Text style={{ flex: 1, color: colors.text, fontSize: fs(14) }}>{t("lmraConfirm")}</Text>
            </TouchableOpacity>
          </View>
        )}
        {!!error && <Text style={{ color: colors.danger, fontSize: fs(13), marginTop: 10 }}>{error}</Text>}
      </ScrollView>

      <View style={[styles.nav, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {step > 1 ? (
          <TouchableOpacity style={[styles.btnOutline, { borderColor: colors.primary }]} onPress={() => setStep(step - 1)}>
            <Text style={{ color: colors.primary, fontWeight: "600", fontSize: fs(15) }}>{t("lmraPrevious")}</Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}
        {step < 3 ? (
          <TouchableOpacity
            style={[styles.btnFill, { backgroundColor: colors.primary, opacity: step === 2 && present.length === 0 ? 0.5 : 1 }]}
            onPress={next}
            disabled={step === 2 && present.length === 0}
          >
            <Text style={{ color: "#FFFFFF", fontWeight: "600", fontSize: fs(15) }}>{t("lmraNext")}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.btnFill, { backgroundColor: colors.success, opacity: canSubmit ? 1 : 0.5 }]}
            onPress={submit}
            disabled={!canSubmit}
          >
            {sending ? <ActivityIndicator color="#FFFFFF" /> : <Text style={{ color: "#FFFFFF", fontWeight: "600", fontSize: fs(15) }}>{t("lmraSubmit")}</Text>}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: { paddingTop: 44, paddingBottom: 8, paddingHorizontal: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1 },
  progress: { flexDirection: "row", justifyContent: "center", paddingVertical: 14, borderBottomWidth: 1 },
  circle: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 16 },
  badge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  hazard: { borderWidth: 2, borderRadius: 10, padding: 12, marginBottom: 10 },
  hazardHead: { flexDirection: "row", alignItems: "center", gap: 10 },
  summary: { borderWidth: 1, borderRadius: 10, padding: 14, marginBottom: 16 },
  summaryRow: { flexDirection: "row", alignItems: "center", paddingVertical: 6 },
  decision: { flex: 1, borderWidth: 2, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 6 },
  confirm: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 10, padding: 14, marginTop: 16 },
  nav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderTopWidth: 1 },
  btnOutline: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 18, paddingVertical: 12 },
  btnFill: { borderRadius: 8, paddingHorizontal: 18, paddingVertical: 12, minWidth: 110, alignItems: "center" },
  successBox: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  histRow: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 8 },
});

export default LMRA;
