import React, { useEffect, useRef, useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppTheme } from "@/contexts/AccessibilityContext";
import { onRealtime } from "@/services/realtime";
import { subscribeToForegroundNotifications } from "@/services/push";

interface EmergencyAlert {
  key: string;
  title?: string | null;
  body?: string | null;
  zone?: string | null;
}

/**
 * Full-screen red alert shown when an `emergency` notification arrives while the app is open
 * (socket `notification:new` or foreground push). Deduplicated per event.
 */
export function EmergencyAlertListener() {
  const { isAuthenticated } = useAuth();
  const { t, isRTL } = useLanguage();
  const { fs } = useAppTheme();
  const [alert, setAlert] = useState<EmergencyAlert | null>(null);
  const seen = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!isAuthenticated) return;
    const handle = (type: unknown, title: unknown, body: unknown, data: Record<string, unknown> | undefined | null) => {
      const kind = type ?? data?.type;
      if (kind !== "emergency" || data?.closed) return;
      const key = String(data?.eventId ?? `${title}|${body}`);
      if (seen.current.has(key)) return;
      seen.current.add(key);
      setAlert({
        key,
        title: typeof title === "string" ? title : null,
        body: typeof body === "string" ? body : null,
        zone: typeof data?.zone === "string" ? data.zone : null,
      });
    };
    const offSocket = onRealtime("notification:new", (n: any) => handle(n?.type, n?.title, n?.body, n?.data));
    const offPush = subscribeToForegroundNotifications((n) => handle(n.data?.type, n.title, n.body, n.data));
    return () => {
      offSocket();
      offPush();
    };
  }, [isAuthenticated]);

  const close = () => setAlert(null);
  const open = () => {
    setAlert(null);
    router.push("/(extra)/emergency");
  };

  return (
    <Modal visible={!!alert} animationType="fade" onRequestClose={close} statusBarTranslucent>
      <View style={[styles.container, { direction: isRTL ? "rtl" : "ltr" }]}>
        <Ionicons name="warning" size={96} color="#FFFFFF" />
        <Text style={[styles.title, { fontSize: fs(28) }]}>{t("emergencyAlertTitle")}</Text>
        {!!alert?.body && <Text style={[styles.body, { fontSize: fs(20) }]}>{alert.body}</Text>}
        {!!alert?.zone && <Text style={[styles.zone, { fontSize: fs(16) }]}>{alert.zone}</Text>}
        <TouchableOpacity style={styles.primary} onPress={open} accessibilityRole="button">
          <Text style={{ color: "#B91C1C", fontWeight: "800", fontSize: fs(16) }}>{t("emergencyAlertOpen")}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondary} onPress={close} accessibilityRole="button">
          <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: fs(15) }}>{t("emergencyAlertDismiss")}</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#B91C1C", alignItems: "center", justifyContent: "center", padding: 24, gap: 14 },
  title: { color: "#FFFFFF", fontWeight: "900", textAlign: "center" },
  body: { color: "#FFFFFF", textAlign: "center" },
  zone: { color: "#FEE2E2", textAlign: "center", fontWeight: "600" },
  primary: { backgroundColor: "#FFFFFF", borderRadius: 12, paddingVertical: 14, paddingHorizontal: 28, marginTop: 20, alignSelf: "stretch", alignItems: "center" },
  secondary: { borderColor: "#FFFFFF", borderWidth: 2, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 28, alignSelf: "stretch", alignItems: "center" },
});
