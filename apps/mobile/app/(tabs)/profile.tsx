import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  I18nManager,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  FontScaleKey,
  useAccessibility,
  useAppTheme,
} from "@/contexts/AccessibilityContext";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { LANGUAGES, LanguageCode, TranslationKey } from "@/constants/Languages";
import {
  NotificationPreferences,
  fetchPreferences,
  updatePreferences,
} from "@/services/notificationApi";
import {
  UserProfile,
  changePassword,
  fetchProfile,
  updateProfile,
} from "@/services/userApi";

const PREF_KEYS = [
  ["incidents", "prefIncidents"],
  ["trainings", "prefTrainings"],
  ["audits", "prefAudits"],
  ["inventory", "prefInventory"],
  ["emergency", "prefEmergency"],
  ["messages", "prefMessages"],
  ["push", "prefPush"],
  ["email", "prefEmail"],
] as const;

const FONT_OPTIONS: [FontScaleKey, TranslationKey][] = [
  ["normal", "textSizeNormal"],
  ["large", "textSizeLarge"],
  ["xlarge", "textSizeXLarge"],
];

const ROLE_KEYS: Record<string, TranslationKey> = {
  admin: "roleAdmin",
  sst_manager: "roleSstManager",
  employee: "roleEmployee",
  pending: "rolePending",
};

const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

type FormState = {
  firstName: string;
  lastName: string;
  phone: string;
  department: string;
  zone: string;
};

const toForm = (p: UserProfile): FormState => ({
  firstName: p.firstName ?? "",
  lastName: p.lastName ?? "",
  phone: p.phone ?? "",
  department: p.department ?? "",
  zone: p.zone ?? "",
});

export default function ProfileScreen() {
  const { user, logout, fetchAndUpdateUser } = useAuth();
  const { t, currentLanguage, setLanguage } = useLanguage();
  const { colors } = useAppTheme();
  const { fontScaleKey, setFontScale, highContrast, setHighContrast } =
    useAccessibility();
  const styles = useThemedStyles(baseStyles);

  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [prefsError, setPrefsError] = useState<string | null>(null);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileError, setProfileError] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);

  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [pwdSaving, setPwdSaving] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const p = await fetchProfile();
      setProfile(p);
      setForm(toForm(p));
      setProfileError(false);
    } catch {
      setProfileError(true);
    }
  }, []);

  useEffect(() => {
    loadProfile();
    fetchPreferences()
      .then(setPrefs)
      .catch(() => setPrefsError(t("prefLoadFailed")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const togglePref = async (key: keyof NotificationPreferences, value: boolean) => {
    if (!prefs) return;
    const previous = prefs;
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    setPrefsError(null);
    try {
      setPrefs(await updatePreferences(next));
    } catch {
      setPrefs(previous);
      setPrefsError(t("prefSaveFailed"));
    }
  };

  const saveProfile = async () => {
    if (!form) return;
    setSaving(true);
    try {
      const updated = await updateProfile({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim(),
        department: form.department.trim(),
        zone: form.zone.trim(),
      });
      setProfile(updated);
      setForm(toForm(updated));
      setEditing(false);
      fetchAndUpdateUser().catch(() => {});
      Alert.alert(t("success"), t("profileSaved"));
    } catch {
      Alert.alert(t("error"), t("profileSaveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const submitPassword = async () => {
    if (!currentPwd || !PASSWORD_RULE.test(newPwd)) {
      Alert.alert(t("error"), t("passwordRuleInvalid"));
      return;
    }
    setPwdSaving(true);
    try {
      await changePassword(currentPwd, newPwd);
      setCurrentPwd("");
      setNewPwd("");
      Alert.alert(t("success"), t("passwordChanged"));
    } catch {
      Alert.alert(t("error"), t("passwordChangeFailed"));
    } finally {
      setPwdSaving(false);
    }
  };

  const chooseLanguage = async (code: LanguageCode) => {
    if (code === currentLanguage) return;
    setLanguage(code);
    if (Platform.OS === "web") return;
    const wantRTL = code === "ar-DZ";
    if (I18nManager.isRTL !== wantRTL) {
      I18nManager.allowRTL(true);
      I18nManager.forceRTL(wantRTL);
      // expo-updates is not installed: ask the user to restart manually.
      Alert.alert(t("languageRestartTitle"), t("languageRestartMessage"));
    }
  };

  const confirmLogout = () => {
    Alert.alert(t("logoutConfirmTitle"), t("logoutConfirmMessage"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("logout"),
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
          } catch {
            Alert.alert(t("error"), t("logoutFailed"));
          }
        },
      },
    ]);
  };

  const fields: [keyof FormState, TranslationKey][] = [
    ["firstName", "firstName"],
    ["lastName", "lastName"],
    ["phone", "phone"],
    ["department", "department"],
    ["zone", "zone"],
  ];

  const roleLabel = user?.role ? t(ROLE_KEYS[user.role] ?? "roleEmployee") : "-";

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>PROSAFE</Text>
            <Text style={styles.logoSubtext}>{t("profileTitle")}</Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        {/* Personal information */}
        <View style={styles.section}>
          <View style={styles.rowBetween}>
            <Text style={styles.label}>{t("profileInfo")}</Text>
            {profile && !editing && (
              <TouchableOpacity onPress={() => setEditing(true)}>
                <Text style={styles.link}>{t("edit")}</Text>
              </TouchableOpacity>
            )}
          </View>
          {profileError && (
            <View>
              <Text style={styles.errorText}>{t("profileLoadFailed")}</Text>
              <TouchableOpacity onPress={loadProfile}>
                <Text style={styles.link}>{t("retry")}</Text>
              </TouchableOpacity>
            </View>
          )}
          {!profile && !profileError && <ActivityIndicator />}
          {profile && form && (
            <>
              <Text style={styles.fieldLabel}>{t("email")}</Text>
              <Text style={styles.value}>{profile.email}</Text>
              <Text style={styles.fieldLabel}>{t("role")}</Text>
              <Text style={styles.value}>{roleLabel}</Text>
              {fields.map(([key, labelKey]) => (
                <View key={key}>
                  <Text style={styles.fieldLabel}>{t(labelKey)}</Text>
                  {editing ? (
                    <TextInput
                      style={styles.input}
                      value={form[key]}
                      onChangeText={(v) => setForm({ ...form, [key]: v })}
                      maxLength={key === "phone" ? 30 : key === "firstName" || key === "lastName" ? 50 : 100}
                      keyboardType={key === "phone" ? "phone-pad" : "default"}
                    />
                  ) : (
                    <Text style={styles.value}>{form[key] || "-"}</Text>
                  )}
                </View>
              ))}
              {editing && (
                <View style={styles.btnRow}>
                  <TouchableOpacity
                    style={[styles.btn, styles.btnGhost]}
                    onPress={() => {
                      setForm(toForm(profile));
                      setEditing(false);
                    }}
                  >
                    <Text style={styles.btnGhostText}>{t("cancel")}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.btn, { backgroundColor: colors.success }]}
                    onPress={saveProfile}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.btnText}>{t("save")}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>

        {/* Change password */}
        <View style={styles.section}>
          <Text style={styles.label}>{t("changePassword")}</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            autoCapitalize="none"
            placeholder={t("currentPassword")}
            placeholderTextColor="#9CA3AF"
            value={currentPwd}
            onChangeText={setCurrentPwd}
          />
          <TextInput
            style={styles.input}
            secureTextEntry
            autoCapitalize="none"
            placeholder={t("newPassword")}
            placeholderTextColor="#9CA3AF"
            value={newPwd}
            onChangeText={setNewPwd}
          />
          <Text style={styles.hint}>{t("newPasswordHint")}</Text>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: colors.primary, marginTop: 10 }]}
            onPress={submitPassword}
            disabled={pwdSaving}
          >
            {pwdSaving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>{t("changePassword")}</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Language */}
        <View style={styles.section}>
          <Text style={styles.label}>{t("language")}</Text>
          <View style={styles.chipRow}>
            {LANGUAGES.map((l) => {
              const active = l.code === currentLanguage;
              return (
                <TouchableOpacity
                  key={l.code}
                  style={[styles.chip, active && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                  onPress={() => chooseLanguage(l.code as LanguageCode)}
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {l.code === "ar-DZ" ? "العربية" : l.nativeName}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Accessibility */}
        <View style={styles.section}>
          <Text style={styles.label}>{t("accessibility")}</Text>
          <Text style={styles.fieldLabel}>{t("textSize")}</Text>
          <View style={styles.chipRow}>
            {FONT_OPTIONS.map(([key, labelKey]) => {
              const active = key === fontScaleKey;
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.chip, active && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                  onPress={() => setFontScale(key)}
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {t(labelKey)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={[styles.prefRow, { marginTop: 8 }]}>
            <Text style={styles.value}>{t("highContrast")}</Text>
            <Switch value={highContrast} onValueChange={setHighContrast} />
          </View>
        </View>

        {/* Notification preferences */}
        <View style={styles.section}>
          <Text style={styles.label}>{t("notificationPreferences")}</Text>
          {prefsError && <Text style={styles.errorText}>{prefsError}</Text>}
          {!prefs && !prefsError && <ActivityIndicator />}
          {prefs &&
            PREF_KEYS.map(([key, label]) => (
              <View key={key} style={styles.prefRow}>
                <Text style={styles.value}>{t(label)}</Text>
                <Switch
                  value={!!prefs[key]}
                  onValueChange={(v) => togglePref(key, v)}
                />
              </View>
            ))}
        </View>

        {/* Feedback ("Donner un avis") is hidden until Phase 5. */}

        <TouchableOpacity
          style={[styles.btn, { backgroundColor: colors.danger, marginBottom: 30 }]}
          onPress={confirmLogout}
        >
          <Text style={styles.btnText}>{t("logout")}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const extraStyles = {
  rowBetween: { flexDirection: "row" as const, justifyContent: "space-between" as const, alignItems: "center" as const },
  link: { fontSize: 15, fontWeight: "600" as const, color: "#1E40AF" },
  errorText: { fontSize: 14, color: "#DC2626", marginBottom: 6 },
  fieldLabel: { fontSize: 13, color: "#6B7280", marginTop: 10, marginBottom: 2 },
  hint: { fontSize: 12, color: "#6B7280", marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 16,
    color: "#1F2937",
    marginTop: 4,
    backgroundColor: "#FFFFFF",
  },
  btnRow: { flexDirection: "row" as const, gap: 10, marginTop: 14 },
  btn: { flex: 1, borderRadius: 10, paddingVertical: 12, alignItems: "center" as const, justifyContent: "center" as const },
  btnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" as const },
  btnGhost: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#D1D5DB" },
  btnGhostText: { color: "#374151", fontSize: 16, fontWeight: "600" as const },
  chipRow: { flexDirection: "row" as const, flexWrap: "wrap" as const, gap: 8, marginTop: 6 },
  chip: { borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  chipText: { fontSize: 14, color: "#374151", fontWeight: "600" as const },
  chipTextActive: { color: "#FFFFFF" },
};

const baseStyles = StyleSheet.create({
  ...extraStyles,
  prefRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    backgroundColor: "#FFFFFE",
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    alignItems: "center",
  },
  logoText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
    letterSpacing: 2,
  },
  logoSubtext: {
    fontSize: 10,
    color: "#6B7280",
    letterSpacing: 1,
    marginTop: 2,
  },
  content: {
    padding: 20,
  },
  section: {
    backgroundColor: "white",
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  value: {
    fontSize: 16,
    color: "#666",
  },
});
