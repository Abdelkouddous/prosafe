import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useLanguage } from "@/contexts/LanguageContext";
import { Chip } from "@/components/Chip";
import { SEVERITY_COLORS } from "@/constants/incidentUi";
import {
  ALLOWED_IMAGE_MIMES,
  ALLOWED_VIDEO_MIMES,
  INCIDENT_SEVERITIES,
  INCIDENT_TYPES,
  IncidentSeverity,
  IncidentType,
  LocalMediaFile,
  MAX_IMAGE_BYTES,
  MAX_MEDIA,
  MAX_VIDEO_BYTES,
  createIncident,
  rewardPoints,
} from "@/services/incidentApi";

const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  mp4: "video/mp4",
  mov: "video/quicktime",
};

const pad = (n: number) => String(n).padStart(2, "0");

const toLocalMedia = (a: ImagePicker.ImagePickerAsset, idx: number): LocalMediaFile => {
  const uriName = a.uri.split("?")[0].split("/").pop() ?? "";
  const ext = (a.fileName ?? uriName).split(".").pop()?.toLowerCase() ?? "";
  const isVideo = a.type === "video" || a.mimeType?.startsWith("video/");
  let mimeType = a.mimeType ?? MIME_BY_EXT[ext] ?? (isVideo ? "video/mp4" : "image/jpeg");
  if (mimeType === "image/jpg") mimeType = "image/jpeg";
  const finalExt = Object.keys(MIME_BY_EXT).find((k) => MIME_BY_EXT[k] === mimeType) ?? ext;
  return {
    uri: a.uri,
    name: a.fileName ?? `media-${Date.now()}-${idx}.${finalExt || "jpg"}`,
    mimeType,
    size: a.fileSize,
    kind: mimeType.startsWith("video/") ? "video" : "image",
  };
};

export default function ReportIncidentScreen() {
  const { t, isRTL } = useLanguage();

  const [type, setType] = useState<IncidentType | null>(null);
  const [severity, setSeverity] = useState<IncidentSeverity | null>(null);
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [dayMode, setDayMode] = useState<"now" | "today" | "yesterday">("now");
  const [timeText, setTimeText] = useState("");
  const [zone, setZone] = useState("");
  const [department, setDepartment] = useState("");
  const [manualAddress, setManualAddress] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoAddress, setGeoAddress] = useState("");
  const [locating, setLocating] = useState(false);
  const [media, setMedia] = useState<LocalMediaFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const locate = useCallback(async () => {
    setLocating(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== "granted") {
        setCoords(null);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      try {
        const [addr] = await Location.reverseGeocodeAsync({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        if (addr) {
          const parts = [addr.name, addr.street, addr.city, addr.region].filter(Boolean);
          setGeoAddress([...new Set(parts)].join(", ").slice(0, 200));
        }
      } catch {
        // reverse geocoding unavailable: coordinates are enough
      }
    } catch {
      setCoords(null);
    } finally {
      setLocating(false);
    }
  }, []);

  useEffect(() => {
    locate();
  }, [locate]);

  const resetForm = () => {
    setType(null);
    setSeverity(null);
    setDescription("");
    setNotes("");
    setDayMode("now");
    setTimeText("");
    setZone("");
    setDepartment("");
    setManualAddress("");
    setMedia([]);
    setProgress(0);
    setError(null);
    locate();
  };

  const addAssets = (assets: ImagePicker.ImagePickerAsset[]) => {
    let next = [...media];
    let problem: string | null = null;
    assets.forEach((a, i) => {
      const m = toLocalMedia(a, i);
      if (next.length >= MAX_MEDIA) {
        problem = t("mediaMax");
        return;
      }
      if (m.kind === "image" && !ALLOWED_IMAGE_MIMES.includes(m.mimeType)) {
        problem = t("mediaUnsupported");
        return;
      }
      if (m.kind === "video" && !ALLOWED_VIDEO_MIMES.includes(m.mimeType)) {
        problem = t("mediaUnsupported");
        return;
      }
      if (m.size !== undefined && m.kind === "image" && m.size > MAX_IMAGE_BYTES) {
        problem = t("mediaTooLargeImage");
        return;
      }
      if (m.size !== undefined && m.kind === "video" && m.size > MAX_VIDEO_BYTES) {
        problem = t("mediaTooLargeVideo");
        return;
      }
      next.push(m);
    });
    setMedia(next);
    if (problem) Alert.alert(t("error"), problem);
  };

  const capture = async (kind: "photo" | "video") => {
    if (media.length >= MAX_MEDIA) {
      Alert.alert(t("error"), t("mediaMax"));
      return;
    }
    if (Platform.OS !== "web") {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(t("error"), t("permissionCamera"));
        return;
      }
    }
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes:
        kind === "photo"
          ? ImagePicker.MediaTypeOptions.Images
          : ImagePicker.MediaTypeOptions.Videos,
      videoMaxDuration: 60,
      quality: 0.7,
    });
    if (!res.canceled) addAssets(res.assets);
  };

  const pickFromGallery = async () => {
    const remaining = MAX_MEDIA - media.length;
    if (remaining <= 0) {
      Alert.alert(t("error"), t("mediaMax"));
      return;
    }
    if (Platform.OS === "ios") {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(t("error"), t("permissionGallery"));
        return;
      }
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.7,
      videoMaxDuration: 60,
    });
    if (!res.canceled) addAssets(res.assets);
  };

  const computeDate = (): Date => {
    const now = new Date();
    if (dayMode === "now") return now;
    const m = /^(\d{1,2}):(\d{2})$/.exec(timeText.trim());
    const d = new Date(now);
    if (dayMode === "yesterday") d.setDate(d.getDate() - 1);
    if (m && +m[1] < 24 && +m[2] < 60) d.setHours(+m[1], +m[2], 0, 0);
    return d > now ? now : d; // never in the future
  };

  const selectDay = (mode: "now" | "today" | "yesterday") => {
    setDayMode(mode);
    if (mode !== "now" && !timeText) {
      const n = new Date();
      setTimeText(`${pad(n.getHours())}:${pad(n.getMinutes())}`);
    }
  };

  const validate = (): string | null => {
    if (!type) return t("typeRequired");
    if (!severity) return t("severityRequired");
    if (!description.trim()) return t("descriptionRequired");
    if (description.length > 200) return t("descriptionTooLong");
    return null;
  };

  const submit = async () => {
    const problem = validate();
    setError(problem);
    if (problem || !type || !severity) return;
    setSubmitting(true);
    setProgress(0);
    try {
      const res = await createIncident(
        {
          type,
          severity,
          description: description.trim(),
          notes: notes.trim() || undefined,
          date: computeDate(),
          latitude: coords?.lat,
          longitude: coords?.lng,
          manualAddress: manualAddress.trim() || geoAddress || undefined,
          zone: zone.trim() || undefined,
          department: department.trim() || undefined,
          media,
        },
        setProgress
      );
      const pts = rewardPoints(res.reward);
      const lines = [`${t("incidentSentRef")}: ${res.incidentId}`];
      if (pts) lines.push(t("rewardEarned").replace("{points}", String(pts)));
      resetForm();
      Alert.alert(t("incidentSent"), lines.join("\n"));
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join("\n") : msg || t("incidentSendFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const dir = { direction: isRTL ? ("rtl" as const) : ("ltr" as const) };
  const align = { textAlign: isRTL ? ("right" as const) : ("left" as const) };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, dir]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, align]}>{t("reportIncident")}</Text>

        <Text style={[styles.label, align]}>{t("incidentType")} *</Text>
        <View style={styles.row}>
          {INCIDENT_TYPES.map((v) => (
            <Chip
              key={v}
              label={t(`type_${v}` as const)}
              selected={type === v}
              onPress={() => setType(v)}
            />
          ))}
        </View>

        <Text style={[styles.label, align]}>{t("incidentSeverity")} *</Text>
        <View style={styles.row}>
          {INCIDENT_SEVERITIES.map((v) => (
            <Chip
              key={v}
              label={t(`severity_${v}` as const)}
              selected={severity === v}
              color={SEVERITY_COLORS[v]}
              onPress={() => setSeverity(v)}
            />
          ))}
        </View>

        <Text style={[styles.label, align]}>{t("descriptionLabel")} *</Text>
        <TextInput
          style={[styles.input, align]}
          value={description}
          onChangeText={setDescription}
          placeholder={t("descriptionPlaceholder")}
          maxLength={200}
          multiline
        />
        <Text style={[styles.counter, align]}>{description.length}/200</Text>

        <Text style={[styles.label, align]}>{t("notesLabel")}</Text>
        <TextInput
          style={[styles.input, styles.multiline, align]}
          value={notes}
          onChangeText={setNotes}
          placeholder={t("notesPlaceholder")}
          maxLength={5000}
          multiline
        />

        <Text style={[styles.label, align]}>{t("incidentDate")}</Text>
        <View style={styles.row}>
          <Chip label={t("dateNow")} selected={dayMode === "now"} onPress={() => selectDay("now")} />
          <Chip label={t("dateToday")} selected={dayMode === "today"} onPress={() => selectDay("today")} />
          <Chip label={t("dateYesterday")} selected={dayMode === "yesterday"} onPress={() => selectDay("yesterday")} />
          {dayMode !== "now" && (
            <TextInput
              style={[styles.input, styles.timeInput]}
              value={timeText}
              onChangeText={setTimeText}
              placeholder="HH:MM"
              keyboardType="numbers-and-punctuation"
              maxLength={5}
            />
          )}
        </View>

        <Text style={[styles.label, align]}>{t("zoneLabel")}</Text>
        <TextInput
          style={[styles.input, align]}
          value={zone}
          onChangeText={setZone}
          placeholder={t("zonePlaceholder")}
          maxLength={100}
        />

        <Text style={[styles.label, align]}>{t("departmentLabel")}</Text>
        <TextInput
          style={[styles.input, align]}
          value={department}
          onChangeText={setDepartment}
          placeholder={t("departmentPlaceholder")}
          maxLength={100}
        />

        <Text style={[styles.label, align]}>{t("locationLabel")}</Text>
        <View style={styles.locationBox}>
          {locating ? (
            <View style={styles.inlineRow}>
              <ActivityIndicator size="small" color="#2563EB" />
              <Text style={styles.locationText}>{t("locating")}</Text>
            </View>
          ) : coords ? (
            <Text style={styles.locationText}>
              {t("locationFound")}: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
              {geoAddress ? `\n${geoAddress}` : ""}
            </Text>
          ) : (
            <Text style={[styles.locationText, { color: "#EA580C" }]}>
              {t("locationUnavailable")}
            </Text>
          )}
          <TouchableOpacity onPress={locate} disabled={locating}>
            <Text style={styles.link}>{t("locationRefresh")}</Text>
          </TouchableOpacity>
        </View>
        <TextInput
          style={[styles.input, align]}
          value={manualAddress}
          onChangeText={setManualAddress}
          placeholder={t("manualAddressPlaceholder")}
          maxLength={200}
        />

        <Text style={[styles.label, align]}>
          {t("mediaLabel")} ({media.length}/{MAX_MEDIA})
        </Text>
        <View style={styles.row}>
          <MediaButton icon="camera" label={t("takePhoto")} onPress={() => capture("photo")} />
          <MediaButton icon="videocam" label={t("recordVideo")} onPress={() => capture("video")} />
          <MediaButton icon="images" label={t("gallery")} onPress={pickFromGallery} />
        </View>
        <View style={styles.row}>
          {media.map((m, i) => (
            <View key={`${m.uri}-${i}`} style={styles.thumbWrap}>
              {m.kind === "image" ? (
                <Image source={{ uri: m.uri }} style={styles.thumb} />
              ) : (
                <View style={[styles.thumb, styles.videoThumb]}>
                  <Ionicons name="play-circle" size={32} color="#FFFFFF" />
                </View>
              )}
              <TouchableOpacity
                style={styles.removeBtn}
                accessibilityLabel={t("removeMedia")}
                onPress={() => setMedia((cur) => cur.filter((_, j) => j !== i))}
              >
                <Ionicons name="close" size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        {submitting && (
          <View style={styles.progressTrack}>
            <View style={[styles.progressBar, { width: `${Math.round(progress * 100)}%` }]} />
          </View>
        )}

        <TouchableOpacity
          style={[styles.submit, submitting && { opacity: 0.6 }]}
          onPress={submit}
          disabled={submitting}
        >
          {submitting ? (
            <Text style={styles.submitText}>
              {t("submitting")} {Math.round(progress * 100)}%
            </Text>
          ) : (
            <Text style={styles.submitText}>{t("submitIncident")}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function MediaButton({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.mediaBtn} onPress={onPress}>
      <Ionicons name={icon} size={20} color="#2563EB" />
      <Text style={styles.mediaBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  content: { padding: 20, paddingTop: 56, paddingBottom: 60 },
  title: { fontSize: 22, fontWeight: "bold", color: "#1F2937", marginBottom: 8 },
  label: { fontSize: 15, fontWeight: "600", color: "#374151", marginTop: 16, marginBottom: 8 },
  row: { flexDirection: "row", flexWrap: "wrap", alignItems: "center" },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#111827",
  },
  multiline: { minHeight: 90, textAlignVertical: "top" },
  counter: { fontSize: 12, color: "#6B7280", marginTop: 4 },
  timeInput: { width: 90, paddingVertical: 8, marginBottom: 8 },
  locationBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  inlineRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  locationText: { fontSize: 14, color: "#374151" },
  link: { color: "#2563EB", marginTop: 6, fontSize: 14, fontWeight: "600" },
  mediaBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    backgroundColor: "#EFF6FF",
    marginRight: 8,
    marginBottom: 8,
  },
  mediaBtnText: { color: "#1D4ED8", fontSize: 14, fontWeight: "500" },
  thumbWrap: { marginRight: 8, marginBottom: 8 },
  thumb: { width: 76, height: 76, borderRadius: 8 },
  videoThumb: { backgroundColor: "#374151", alignItems: "center", justifyContent: "center" },
  removeBtn: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#DC2626",
    alignItems: "center",
    justifyContent: "center",
  },
  error: { color: "#DC2626", marginTop: 12, fontSize: 14 },
  progressTrack: { height: 6, backgroundColor: "#E5E7EB", borderRadius: 3, marginTop: 16 },
  progressBar: { height: 6, backgroundColor: "#16A34A", borderRadius: 3 },
  submit: {
    backgroundColor: "#DC2626",
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    marginTop: 20,
  },
  submitText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
});
