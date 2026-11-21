import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
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
import { RISK_HC_LEVEL_COLORS, RISK_LEVEL_COLORS } from "@/constants/riskUi";
import {
  createRisk,
  fetchRisk,
  fetchRiskMatrix,
  fetchRisks,
  levelFromScore,
  MatrixCell,
  Risk,
  RISK_LEVELS,
  RiskLevel,
  RiskMatrix,
} from "@/services/risksApi";

type Segment = "catalogue" | "matrix" | "propose";
const CATEGORIES = ["physical", "chemical", "electrical", "mechanical", "ergonomic", "fire", "other"] as const;
const SCALE = [1, 2, 3, 4, 5];

const levelKey = (l: RiskLevel) => `risksLevel_${l}` as TranslationKey;

export default function RisksScreen() {
  const { t, isRTL } = useLanguage();
  const { colors, fs, highContrast } = useAppTheme();
  const [segment, setSegment] = useState<Segment>("catalogue");
  const [detail, setDetail] = useState<Risk | null>(null);

  const levelColors = highContrast ? RISK_HC_LEVEL_COLORS : RISK_LEVEL_COLORS;
  const back = () => (router.canGoBack() ? router.back() : router.replace("/(tabs)/home"));

  const segments: { key: Segment; label: string }[] = [
    { key: "catalogue", label: t("risksCatalogue") },
    { key: "matrix", label: t("risksMatrix") },
    { key: "propose", label: t("risksPropose") },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, direction: isRTL ? "rtl" : "ltr" }}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={back} accessibilityLabel={t("back")} style={styles.backBtn}>
            <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={{ color: colors.text, fontSize: fs(20), fontWeight: "700" }}>{t("risksTitle")}</Text>
        </View>
        <View style={styles.segments}>
          {segments.map((s) => {
            const active = s.key === segment;
            return (
              <TouchableOpacity
                key={s.key}
                onPress={() => setSegment(s.key)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={[
                  styles.segment,
                  { borderColor: colors.primary, backgroundColor: active ? colors.primary : "transparent" },
                ]}
              >
                <Text
                  style={{ color: active ? "#FFFFFF" : colors.primary, fontSize: fs(12), fontWeight: "600", textAlign: "center" }}
                >
                  {s.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {segment === "catalogue" && <Catalogue onOpen={setDetail} levelColors={levelColors} />}
      {segment === "matrix" && <Matrix onOpen={setDetail} levelColors={levelColors} />}
      {segment === "propose" && <ProposeForm levelColors={levelColors} onDone={() => setSegment("catalogue")} />}

      <RiskDetail risk={detail} onClose={() => setDetail(null)} levelColors={levelColors} />
    </View>
  );
}

type LevelColors = Record<RiskLevel, string>;

function LevelBadge({ level, colorMap, label }: { level: RiskLevel; colorMap: LevelColors; label?: string }) {
  const { t } = useLanguage();
  const { fs } = useAppTheme();
  return (
    <View style={[styles.badge, { backgroundColor: colorMap[level] }]}>
      <Text style={{ color: "#FFFFFF", fontSize: fs(11), fontWeight: "700" }}>{label ?? t(levelKey(level))}</Text>
    </View>
  );
}

function RiskRow({ risk, onPress, levelColors }: { risk: Risk; onPress: () => void; levelColors: LevelColors }) {
  const { colors, fs } = useAppTheme();
  const { t } = useLanguage();
  return (
    <TouchableOpacity
      style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border, borderLeftColor: levelColors[risk.level] }]}
      onPress={onPress}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.text, fontSize: fs(15), fontWeight: "600" }} numberOfLines={2}>
          {risk.title}
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: fs(12), marginTop: 2 }} numberOfLines={1}>
          {[risk.zone, risk.hazardCategory].filter(Boolean).join(" - ")}
          {risk.status === "proposed" ? `  (${t("risksStatus_proposed")})` : ""}
        </Text>
      </View>
      <View style={{ alignItems: "flex-end", gap: 4 }}>
        <LevelBadge level={risk.level} colorMap={levelColors} />
        <Text style={{ color: colors.textSecondary, fontSize: fs(11) }}>
          {t("risksScore")} {risk.score}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function Catalogue({ onOpen, levelColors }: { onOpen: (r: Risk) => void; levelColors: LevelColors }) {
  const { t, isRTL } = useLanguage();
  const { colors, fs } = useAppTheme();
  const [search, setSearch] = useState("");
  const [zone, setZone] = useState("");
  const [level, setLevel] = useState<RiskLevel | null>(null);
  const [risks, setRisks] = useState<Risk[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const res = await fetchRisks({
          level: level ?? undefined,
          zone: zone.trim() || undefined,
          search: search.trim() || undefined,
          limit: 100,
        });
        if (cancelled) return;
        setRisks(res.data);
        setFailed(false);
      } catch {
        if (!cancelled) setFailed(true);
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search, zone, level, reloadKey]);

  const align = { textAlign: isRTL ? ("right" as const) : ("left" as const) };
  const inputStyle = [styles.input, align, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface, fontSize: fs(14) }];

  return (
    <FlatList
      data={risks ?? []}
      keyExtractor={(r) => String(r.id)}
      contentContainerStyle={styles.list}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t("p4Search")}
            placeholderTextColor={colors.textSecondary}
            style={inputStyle}
          />
          <TextInput
            value={zone}
            onChangeText={setZone}
            placeholder={t("risksFilterZone")}
            placeholderTextColor={colors.textSecondary}
            style={inputStyle}
          />
          <View style={styles.chipRow}>
            <Pill label={t("p4All")} active={level === null} color={colors.primary} onPress={() => setLevel(null)} />
            {RISK_LEVELS.map((l) => (
              <Pill key={l} label={t(levelKey(l))} active={level === l} color={levelColors[l]} onPress={() => setLevel(l)} />
            ))}
          </View>
          {failed && (
            <TouchableOpacity onPress={() => setReloadKey((k) => k + 1)}>
              <Text style={{ color: colors.danger, fontSize: fs(13), marginBottom: 8 }}>
                {t("p4LoadFailed")} {t("p4Retry")}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      }
      renderItem={({ item }) => <RiskRow risk={item} levelColors={levelColors} onPress={() => onOpen(item)} />}
      ListEmptyComponent={
        risks === null && !failed ? (
          <ActivityIndicator style={{ marginTop: 30 }} color={colors.primary} size="large" />
        ) : failed ? null : (
          <Text style={{ color: colors.textSecondary, textAlign: "center", marginTop: 40, fontSize: fs(15) }}>
            {t("risksEmpty")}
          </Text>
        )
      }
    />
  );
}

function Pill({ label, active, color, onPress }: { label: string; active: boolean; color: string; onPress: () => void }) {
  const { colors, fs } = useAppTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[styles.pill, { borderColor: active ? color : colors.border, backgroundColor: active ? color : colors.surface }]}
    >
      <Text style={{ color: active ? "#FFFFFF" : colors.text, fontSize: fs(13), fontWeight: "600" }}>{label}</Text>
    </TouchableOpacity>
  );
}

function Matrix({ onOpen, levelColors }: { onOpen: (r: Risk) => void; levelColors: LevelColors }) {
  const { t } = useLanguage();
  const { colors, fs } = useAppTheme();
  const [matrix, setMatrix] = useState<RiskMatrix | null>(null);
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState<MatrixCell | null>(null);
  const [cellRisks, setCellRisks] = useState<Risk[] | null>(null);

  const load = useCallback(async () => {
    setFailed(false);
    try {
      setMatrix(await fetchRiskMatrix());
    } catch {
      setFailed(true);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const cellMap = useMemo(() => {
    const m = new Map<string, MatrixCell>();
    matrix?.cells.forEach((c) => m.set(`${c.gravity}-${c.probability}`, c));
    return m;
  }, [matrix]);

  const pick = async (cell: MatrixCell) => {
    setSelected(cell);
    setCellRisks(null);
    if (!cell.count) {
      setCellRisks([]);
      return;
    }
    const res = await Promise.allSettled(cell.riskIds.map((id) => fetchRisk(id)));
    setCellRisks(res.flatMap((r) => (r.status === "fulfilled" ? [r.value] : [])));
  };

  if (failed) {
    return (
      <TouchableOpacity style={{ padding: 20 }} onPress={load}>
        <Text style={{ color: colors.danger, fontSize: fs(14) }}>
          {t("p4LoadFailed")} {t("p4Retry")}
        </Text>
      </TouchableOpacity>
    );
  }
  if (!matrix) return <ActivityIndicator style={{ marginTop: 30 }} color={colors.primary} size="large" />;

  return (
    <ScrollView contentContainerStyle={styles.list}>
      <Text style={{ color: colors.textSecondary, fontSize: fs(13), marginBottom: 4 }}>
        {t("risksMatrixTotal").replace("{n}", String(matrix.total))}
      </Text>
      <Text style={{ color: colors.textSecondary, fontSize: fs(12), marginBottom: 10 }}>{t("risksMatrixHint")}</Text>
      <View style={{ flexDirection: "row" }}>
        <View style={styles.axisY}>
          <Text style={{ color: colors.textSecondary, fontSize: fs(11), transform: [{ rotate: "-90deg" }], width: 90, textAlign: "center" }}>
            {t("risksGravity")}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          {[5, 4, 3, 2, 1].map((g) => (
            <View key={g} style={styles.matrixRow}>
              <Text style={[styles.axisNum, { color: colors.textSecondary, fontSize: fs(11) }]}>{g}</Text>
              {SCALE.map((p) => {
                const cell = cellMap.get(`${g}-${p}`);
                const level = cell?.level ?? levelFromScore(g * p);
                const isSel = selected?.gravity === g && selected?.probability === p;
                return (
                  <TouchableOpacity
                    key={p}
                    disabled={!cell}
                    onPress={() => cell && pick(cell)}
                    accessibilityLabel={`${t("risksMatrixCell").replace("{g}", String(g)).replace("{p}", String(p))}: ${cell?.count ?? 0}`}
                    style={[
                      styles.cell,
                      { backgroundColor: levelColors[level], opacity: cell && cell.count ? 1 : 0.45 },
                      isSel && { borderWidth: 3, borderColor: colors.text },
                    ]}
                  >
                    <Text style={{ color: "#FFFFFF", fontWeight: "800", fontSize: fs(16) }}>{cell?.count ? cell.count : ""}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
          <View style={styles.matrixRow}>
            <Text style={styles.axisNum} />
            {SCALE.map((p) => (
              <Text key={p} style={[styles.axisCol, { color: colors.textSecondary, fontSize: fs(11) }]}>
                {p}
              </Text>
            ))}
          </View>
          <Text style={{ color: colors.textSecondary, fontSize: fs(11), textAlign: "center" }}>{t("risksProbability")}</Text>
        </View>
      </View>

      {selected && (
        <View style={{ marginTop: 16 }}>
          <Text style={{ color: colors.text, fontSize: fs(15), fontWeight: "700", marginBottom: 8 }}>
            {t("risksMatrixCell").replace("{g}", String(selected.gravity)).replace("{p}", String(selected.probability))}
            {` (${t("risksScore")} ${selected.score})`}
          </Text>
          {cellRisks === null ? (
            <ActivityIndicator color={colors.primary} />
          ) : cellRisks.length === 0 ? (
            <Text style={{ color: colors.textSecondary, fontSize: fs(13) }}>{t("risksMatrixNone")}</Text>
          ) : (
            cellRisks.map((r) => <RiskRow key={r.id} risk={r} levelColors={levelColors} onPress={() => onOpen(r)} />)
          )}
        </View>
      )}
    </ScrollView>
  );
}

function RiskDetail({ risk, onClose, levelColors }: { risk: Risk | null; onClose: () => void; levelColors: LevelColors }) {
  const { t, isRTL } = useLanguage();
  const { colors, fs } = useAppTheme();
  const field = (label: string, value?: string | null) =>
    value ? (
      <View style={{ marginTop: 12 }}>
        <Text style={{ color: colors.textSecondary, fontSize: fs(12), fontWeight: "600" }}>{label}</Text>
        <Text style={{ color: colors.text, fontSize: fs(15), marginTop: 2 }}>{value}</Text>
      </View>
    ) : null;
  return (
    <Modal visible={!!risk} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        {risk && (
          <View style={[styles.sheet, { backgroundColor: colors.surface, direction: isRTL ? "rtl" : "ltr" }]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={{ flex: 1, color: colors.text, fontSize: fs(18), fontWeight: "700" }}>{risk.title}</Text>
              <TouchableOpacity onPress={onClose} accessibilityLabel={t("p4Close")}>
                <Ionicons name="close" size={26} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 460 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10 }}>
                <LevelBadge level={risk.level} colorMap={levelColors} />
                <Text style={{ color: colors.text, fontSize: fs(14), fontWeight: "700" }}>
                  {t("risksScore")} {risk.score} ({risk.gravity} x {risk.probability})
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: fs(12) }}>
                  {t(`risksStatus_${risk.status}` as TranslationKey)}
                </Text>
              </View>
              {field(t("risksGravity"), String(risk.gravity))}
              {field(t("risksProbability"), String(risk.probability))}
              {field(t("risksDescription"), risk.description)}
              {field(t("risksMeasures"), risk.recommendedMeasures)}
              {field(t("risksCategory"), risk.hazardCategory)}
              {field(t("p4Zone"), risk.zone)}
              {field(t("risksDepartment"), risk.department)}
            </ScrollView>
          </View>
        )}
      </View>
    </Modal>
  );
}

function ProposeForm({ levelColors, onDone }: { levelColors: LevelColors; onDone: () => void }) {
  const { t, isRTL } = useLanguage();
  const { colors, fs } = useAppTheme();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("physical");
  const [zone, setZone] = useState("");
  const [measures, setMeasures] = useState("");
  const [gravity, setGravity] = useState(3);
  const [probability, setProbability] = useState(3);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const score = gravity * probability;
  const level = levelFromScore(score);
  const align = { textAlign: isRTL ? ("right" as const) : ("left" as const) };
  const inputStyle = [styles.input, align, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface, fontSize: fs(14) }];
  const label = (k: TranslationKey) => (
    <Text style={{ color: colors.text, fontSize: fs(14), fontWeight: "600", marginBottom: 4 }}>{t(k)}</Text>
  );

  const submit = async () => {
    if (!title.trim() || !description.trim() || !zone.trim()) {
      setError(t("risksProposeFillFields"));
      return;
    }
    setSending(true);
    setError(null);
    try {
      await createRisk({
        title: title.trim(),
        description: description.trim(),
        hazardCategory: category,
        zone: zone.trim(),
        gravity,
        probability,
        recommendedMeasures: measures.trim() || undefined,
      });
      setTitle("");
      setDescription("");
      setZone("");
      setMeasures("");
      setGravity(3);
      setProbability(3);
      if (Platform.OS === "web") {
        onDone();
      } else {
        Alert.alert(t("success"), t("risksProposeSuccess"), [{ text: t("ok"), onPress: onDone }]);
      }
    } catch {
      setError(t("risksProposeFailed"));
    } finally {
      setSending(false);
    }
  };

  const scale = (value: number, set: (n: number) => void) => (
    <View style={styles.scaleRow}>
      {SCALE.map((n) => {
        const active = n === value;
        return (
          <TouchableOpacity
            key={n}
            onPress={() => set(n)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={[styles.scaleBtn, { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primary : colors.surface }]}
          >
            <Text style={{ color: active ? "#FFFFFF" : colors.text, fontWeight: "700", fontSize: fs(15) }}>{n}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
        {label("risksTitleField")}
        <TextInput value={title} onChangeText={setTitle} maxLength={200} style={inputStyle} placeholderTextColor={colors.textSecondary} />
        {label("risksDescription")}
        <TextInput
          value={description}
          onChangeText={setDescription}
          multiline
          style={[inputStyle, { height: 90, textAlignVertical: "top" }]}
          placeholderTextColor={colors.textSecondary}
        />
        {label("risksCategory")}
        <View style={styles.chipRow}>
          {CATEGORIES.map((c) => (
            <Pill key={c} label={t(`risksCat_${c}` as TranslationKey)} active={category === c} color={colors.primary} onPress={() => setCategory(c)} />
          ))}
        </View>
        {label("p4Zone")}
        <TextInput value={zone} onChangeText={setZone} maxLength={100} style={inputStyle} placeholderTextColor={colors.textSecondary} />
        {label("risksGravity")}
        {scale(gravity, setGravity)}
        {label("risksProbability")}
        {scale(probability, setProbability)}
        <View style={[styles.preview, { borderColor: levelColors[level] }]}>
          <LevelBadge level={level} colorMap={levelColors} />
          <Text style={{ color: colors.text, fontSize: fs(14), fontWeight: "700" }}>
            {t("risksLivePreview").replace("{score}", String(score)).replace("{level}", t(levelKey(level)))}
          </Text>
        </View>
        {label("risksMeasures")}
        <TextInput
          value={measures}
          onChangeText={setMeasures}
          multiline
          style={[inputStyle, { height: 70, textAlignVertical: "top" }]}
          placeholderTextColor={colors.textSecondary}
        />
        {!!error && <Text style={{ color: colors.danger, fontSize: fs(13), marginBottom: 8 }}>{error}</Text>}
        <TouchableOpacity
          style={[styles.submit, { backgroundColor: colors.success, opacity: sending ? 0.6 : 1 }]}
          onPress={submit}
          disabled={sending}
        >
          {sending ? <ActivityIndicator color="#FFFFFF" /> : <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: fs(16) }}>{t("p4Send")}</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 44, paddingBottom: 10, paddingHorizontal: 12, borderBottomWidth: 1 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  backBtn: { padding: 6 },
  segments: { flexDirection: "row", gap: 6 },
  segment: { flex: 1, borderWidth: 1, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 4, alignItems: "center" },
  list: { padding: 12, paddingBottom: 60, flexGrow: 1 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 10 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  pill: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  row: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderLeftWidth: 5, borderRadius: 10, padding: 12, marginBottom: 8 },
  badge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  axisY: { width: 22, alignItems: "center", justifyContent: "center" },
  axisNum: { width: 18, textAlign: "center", alignSelf: "center" },
  axisCol: { flex: 1, textAlign: "center" },
  matrixRow: { flexDirection: "row", marginBottom: 4, gap: 4 },
  cell: { flex: 1, aspectRatio: 1, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" },
  sheet: { borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, paddingBottom: 28 },
  scaleRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  scaleBtn: { flex: 1, borderWidth: 1, borderRadius: 8, paddingVertical: 10, alignItems: "center" },
  preview: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 2, borderRadius: 10, padding: 10, marginBottom: 12 },
  submit: { borderRadius: 10, paddingVertical: 14, alignItems: "center", justifyContent: "center", marginTop: 4 },
});
