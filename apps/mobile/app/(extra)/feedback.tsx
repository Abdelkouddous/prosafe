import React, { useState } from "react";
import {
  ActivityIndicator,
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
import { router } from "expo-router";
import Constants from "expo-constants";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppTheme } from "@/contexts/AccessibilityContext";
import { TranslationKey } from "@/constants/Languages";
import { FEEDBACK_CATEGORIES, FeedbackCategory, sendFeedback } from "@/services/feedbackApi";

export default function FeedbackScreen() {
  const { t, isRTL } = useLanguage();
  const { colors, fs } = useAppTheme();
  const [rating, setRating] = useState(0);
  const [category, setCategory] = useState<FeedbackCategory>("suggestion");
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const back = () => (router.canGoBack() ? router.back() : router.replace("/(tabs)/profile"));

  const submit = async () => {
    if (rating < 1 || !comment.trim()) {
      setError(t("feedbackFill"));
      return;
    }
    setSending(true);
    setError(null);
    try {
      await sendFeedback({
        rating,
        category,
        comment: comment.trim(),
        appVersion: Constants.expoConfig?.version,
        platform: Platform.OS,
      });
      setSent(true);
    } catch {
      setError(t("feedbackFailed"));
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, direction: isRTL ? "rtl" : "ltr" }}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TouchableOpacity onPress={back} accessibilityLabel={t("back")} style={{ padding: 6 }}>
          <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ color: colors.text, fontSize: fs(20), fontWeight: "700" }}>{t("feedbackTitle")}</Text>
      </View>

      {sent ? (
        <View style={styles.thanks}>
          <Ionicons name="heart" size={72} color={colors.success} />
          <Text style={{ color: colors.text, fontSize: fs(20), fontWeight: "700", marginTop: 10, textAlign: "center" }}>
            {t("feedbackThanks")}
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: fs(14), marginTop: 6, textAlign: "center" }}>
            {t("feedbackThanksMessage")}
          </Text>
          <TouchableOpacity style={[styles.submit, { backgroundColor: colors.primary, paddingHorizontal: 30 }]} onPress={back}>
            <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: fs(16) }}>{t("lmraDone")}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
            <Text style={[styles.label, { color: colors.text, fontSize: fs(15) }]}>{t("feedbackRating")}</Text>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((n) => (
                <TouchableOpacity
                  key={n}
                  onPress={() => setRating(n)}
                  accessibilityRole="button"
                  accessibilityLabel={`${n}/5`}
                  accessibilityState={{ selected: n === rating }}
                >
                  <Ionicons name={n <= rating ? "star" : "star-outline"} size={40} color={colors.warning} />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: colors.text, fontSize: fs(15) }]}>{t("feedbackCategory")}</Text>
            <View style={styles.chips}>
              {FEEDBACK_CATEGORIES.map((c) => {
                const active = c === category;
                return (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setCategory(c)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    style={[styles.chip, { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primary : colors.surface }]}
                  >
                    <Text style={{ color: active ? "#FFFFFF" : colors.text, fontSize: fs(14), fontWeight: "600" }}>
                      {t(`feedbackCat_${c}` as TranslationKey)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.label, { color: colors.text, fontSize: fs(15) }]}>{t("feedbackComment")}</Text>
            <TextInput
              value={comment}
              onChangeText={setComment}
              multiline
              maxLength={2000}
              placeholder={t("feedbackCommentPlaceholder")}
              placeholderTextColor={colors.textSecondary}
              style={[
                styles.input,
                { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface, fontSize: fs(15), textAlign: isRTL ? "right" : "left" },
              ]}
            />
            {!!error && <Text style={{ color: colors.danger, fontSize: fs(13), marginBottom: 8 }}>{error}</Text>}
            <TouchableOpacity
              style={[styles.submit, { backgroundColor: colors.success, opacity: sending ? 0.6 : 1 }]}
              onPress={submit}
              disabled={sending}
            >
              {sending ? <ActivityIndicator color="#FFFFFF" /> : <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: fs(16) }}>{t("feedbackSubmit")}</Text>}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 44, paddingBottom: 8, paddingHorizontal: 8, flexDirection: "row", alignItems: "center", gap: 6, borderBottomWidth: 1 },
  label: { fontWeight: "600", marginBottom: 8, marginTop: 8 },
  stars: { flexDirection: "row", gap: 8, marginBottom: 12 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  chip: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, height: 130, textAlignVertical: "top", marginBottom: 12 },
  submit: { borderRadius: 10, paddingVertical: 14, alignItems: "center", justifyContent: "center" },
  thanks: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
});
