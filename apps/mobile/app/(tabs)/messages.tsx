import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
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
import {
  Announcement,
  Conversation,
  createConversation,
  fetchAnnouncements,
  fetchConversations,
  markAnnouncementRead,
  personName,
} from "@/services/messagingApi";
import { isRealtimeConnected, onRealtime } from "@/services/realtime";

type Segment = "conversations" | "announcements";
const POLL_MS = 15000;

export default function MessagesScreen() {
  const { user } = useAuth();
  const { t, isRTL, currentLanguage } = useLanguage();
  const { colors, fs } = useAppTheme();
  const [segment, setSegment] = useState<Segment>("conversations");
  const [conversations, setConversations] = useState<Conversation[] | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[] | null>(null);
  const [errors, setErrors] = useState({ conv: false, ann: false });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [openAnn, setOpenAnn] = useState<number | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [composeError, setComposeError] = useState<string | null>(null);

  const isManager = user?.role === "admin" || user?.role === "sst_manager";
  const myId = user?.id !== undefined ? Number(user.id) : NaN;

  const loadConversations = useCallback(async () => {
    try {
      setConversations(await fetchConversations());
      setErrors((e) => ({ ...e, conv: false }));
    } catch {
      setErrors((e) => ({ ...e, conv: true }));
    }
  }, []);

  const loadAnnouncements = useCallback(async () => {
    try {
      setAnnouncements(await fetchAnnouncements());
      setErrors((e) => ({ ...e, ann: false }));
    } catch {
      setErrors((e) => ({ ...e, ann: true }));
    }
  }, []);

  const loadAll = useCallback(async () => {
    await Promise.all([loadConversations(), loadAnnouncements()]);
    setLoading(false);
  }, [loadConversations, loadAnnouncements]);

  useFocusEffect(
    useCallback(() => {
      loadAll();
      // Polling fallback (15 s) only while the socket is not connected
      const timer = setInterval(() => {
        if (!isRealtimeConnected()) loadConversations();
      }, POLL_MS);
      const off = onRealtime("message:new", () => loadConversations());
      return () => {
        clearInterval(timer);
        off();
      };
    }, [loadAll, loadConversations])
  );

  useEffect(() => {
    if (!composeOpen) setComposeError(null);
  }, [composeOpen]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

  const submitNew = async () => {
    if (!subject.trim() || !body.trim()) {
      setComposeError(t("messagesFillFields"));
      return;
    }
    setSending(true);
    setComposeError(null);
    try {
      const conv = await createConversation({ subject: subject.trim(), body: body.trim() });
      setComposeOpen(false);
      setSubject("");
      setBody("");
      loadConversations();
      router.push({ pathname: "/conversation/[id]", params: { id: String(conv.id) } });
    } catch {
      setComposeError(t("messagesNewFailed"));
    } finally {
      setSending(false);
    }
  };

  const openAnnouncement = (a: Announcement) => {
    setOpenAnn(openAnn === a.id ? null : a.id);
    if (a.recipient_id === myId && a.status !== "read") {
      setAnnouncements((prev) =>
        prev ? prev.map((x) => (x.id === a.id ? { ...x, status: "read" } : x)) : prev
      );
      markAnnouncementRead(a.id).catch(() => {});
    }
  };

  const fmt = (d?: string) => {
    if (!d) return "";
    const date = new Date(d);
    if (isNaN(date.getTime())) return "";
    const sameDay = date.toDateString() === new Date().toDateString();
    return sameDay
      ? date.toLocaleTimeString(currentLanguage, { hour: "2-digit", minute: "2-digit" })
      : date.toLocaleDateString(currentLanguage, { day: "numeric", month: "short" });
  };

  const otherNames = (c: Conversation) =>
    c.participants
      .filter((p) => p.id !== myId)
      .map(personName)
      .filter(Boolean)
      .join(", ");

  const errorBox = (
    <Text style={{ color: colors.danger, fontSize: fs(13), padding: 16 }}>{t("messagesLoadFailed")}</Text>
  );
  const empty = (key: "messagesNoConversations" | "messagesNoAnnouncements") => (
    <View style={styles.empty}>
      <Ionicons name="chatbubble-outline" size={56} color={colors.textSecondary} />
      <Text style={{ color: colors.textSecondary, fontSize: fs(15), marginTop: 8 }}>{t(key)}</Text>
    </View>
  );

  const renderConversation = ({ item }: { item: Conversation }) => {
    const unread = item.unreadCount > 0;
    return (
      <TouchableOpacity
        style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => router.push({ pathname: "/conversation/[id]", params: { id: String(item.id) } })}
      >
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Ionicons name="person" size={20} color="#FFFFFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{ color: colors.text, fontSize: fs(15), fontWeight: unread ? "800" : "600" }}
            numberOfLines={1}
          >
            {item.subject}
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: fs(12) }} numberOfLines={1}>
            {otherNames(item)}
          </Text>
          {!!item.lastMessage && (
            <Text
              style={{ color: unread ? colors.text : colors.textSecondary, fontSize: fs(13) }}
              numberOfLines={1}
            >
              {item.lastMessage.body}
            </Text>
          )}
        </View>
        <View style={{ alignItems: "flex-end", gap: 4 }}>
          <Text style={{ color: colors.textSecondary, fontSize: fs(11) }}>
            {fmt(item.lastMessage?.createdAt ?? item.updatedAt)}
          </Text>
          {unread && (
            <View style={[styles.badge, { backgroundColor: colors.danger }]}>
              <Text style={styles.badgeText}>{item.unreadCount > 99 ? "99+" : item.unreadCount}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderAnnouncement = ({ item }: { item: Announcement }) => {
    const unread = item.recipient_id === myId && item.status !== "read";
    const expanded = openAnn === item.id;
    const sender =
      [item.sender?.firstName, item.sender?.lastName].filter(Boolean).join(" ") ||
      item.sender?.email ||
      t("messagesUnknownSender");
    return (
      <TouchableOpacity
        style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border, alignItems: "flex-start" }]}
        onPress={() => openAnnouncement(item)}
      >
        <View style={[styles.avatar, { backgroundColor: colors.warning }]}>
          <Ionicons name="megaphone" size={20} color="#FFFFFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontSize: fs(15), fontWeight: unread ? "800" : "600" }}>
            {item.subject || "-"}
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: fs(12) }}>{sender}</Text>
          <Text
            style={{ color: colors.text, fontSize: fs(13), marginTop: 2 }}
            numberOfLines={expanded ? undefined : 2}
          >
            {item.content}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end", gap: 4 }}>
          <Text style={{ color: colors.textSecondary, fontSize: fs(11) }}>{fmt(item.created_at)}</Text>
          {unread && <View style={[styles.dot, { backgroundColor: colors.danger }]} />}
        </View>
      </TouchableOpacity>
    );
  };

  const unreadConv = (conversations ?? []).reduce((n, c) => n + (c.unreadCount > 0 ? 1 : 0), 0);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, direction: isRTL ? "rtl" : "ltr" }}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={{ color: colors.text, fontSize: fs(20), fontWeight: "700", marginBottom: 10 }}>
          {t("messagesTitle")}
        </Text>
        <View style={styles.segments}>
          {(["conversations", "announcements"] as Segment[]).map((s) => {
            const active = s === segment;
            return (
              <TouchableOpacity
                key={s}
                onPress={() => setSegment(s)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={[
                  styles.segment,
                  { borderColor: colors.primary, backgroundColor: active ? colors.primary : "transparent" },
                ]}
              >
                <Text style={{ color: active ? "#FFFFFF" : colors.primary, fontSize: fs(13), fontWeight: "600" }}>
                  {s === "conversations" ? t("messagesConversations") : t("messagesAnnouncements")}
                  {s === "conversations" && unreadConv > 0 ? ` (${unreadConv})` : ""}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 30 }} color={colors.primary} size="large" />
      ) : segment === "conversations" ? (
        <FlatList
          data={conversations ?? []}
          keyExtractor={(c) => String(c.id)}
          renderItem={renderConversation}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListHeaderComponent={errors.conv ? errorBox : null}
          ListEmptyComponent={errors.conv ? null : empty("messagesNoConversations")}
        />
      ) : (
        <FlatList
          data={announcements ?? []}
          keyExtractor={(a) => String(a.id)}
          renderItem={renderAnnouncement}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListHeaderComponent={errors.ann ? errorBox : null}
          ListEmptyComponent={errors.ann ? null : empty("messagesNoAnnouncements")}
        />
      )}

      {/* Managers must pick a recipient and the API has no user lookup for them: button hidden */}
      {segment === "conversations" && !isManager && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={() => setComposeOpen(true)}
          accessibilityRole="button"
        >
          <Ionicons name="create" size={20} color="#FFFFFF" />
          <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: fs(14) }}>
            {t("messagesNewConversation")}
          </Text>
        </TouchableOpacity>
      )}

      <Modal visible={composeOpen} transparent animationType="slide" onRequestClose={() => setComposeOpen(false)}>
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
            <Text style={{ color: colors.text, fontSize: fs(17), fontWeight: "700", marginBottom: 10 }}>
              {t("messagesNewConversation")}
            </Text>
            <TextInput
              value={subject}
              onChangeText={setSubject}
              placeholder={t("messagesSubject")}
              placeholderTextColor={colors.textSecondary}
              maxLength={200}
              style={[styles.input, { color: colors.text, borderColor: colors.border, fontSize: fs(15), textAlign: isRTL ? "right" : "left" }]}
            />
            <TextInput
              value={body}
              onChangeText={setBody}
              placeholder={t("messagesBody")}
              placeholderTextColor={colors.textSecondary}
              multiline
              maxLength={5000}
              style={[
                styles.input,
                { color: colors.text, borderColor: colors.border, fontSize: fs(15), height: 120, textAlignVertical: "top", textAlign: isRTL ? "right" : "left" },
              ]}
            />
            {!!composeError && (
              <Text style={{ color: colors.danger, fontSize: fs(13), marginBottom: 8 }}>{composeError}</Text>
            )}
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                style={[styles.btn, { borderColor: colors.border, borderWidth: 1 }]}
                onPress={() => setComposeOpen(false)}
              >
                <Text style={{ color: colors.text, fontSize: fs(15) }}>{t("messagesCancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: colors.primary, opacity: sending ? 0.6 : 1 }]}
                onPress={submitNew}
                disabled={sending}
              >
                {sending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: fs(15) }}>{t("messagesSend")}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 50, paddingBottom: 12, paddingHorizontal: 16, borderBottomWidth: 1 },
  segments: { flexDirection: "row", gap: 8 },
  segment: { flex: 1, borderWidth: 1, borderRadius: 8, paddingVertical: 8, alignItems: "center" },
  list: { padding: 12, paddingBottom: 100, flexGrow: 1 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  badge: { minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 6, alignItems: "center", justifyContent: "center" },
  badgeText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  dot: { width: 10, height: 10, borderRadius: 5 },
  empty: { alignItems: "center", marginTop: 60 },
  fab: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 28,
    paddingVertical: 12,
    paddingHorizontal: 20,
    elevation: 4,
  },
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" },
  sheet: { borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16 },
  input: { borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 10 },
  btn: { flex: 1, borderRadius: 8, paddingVertical: 12, alignItems: "center", justifyContent: "center" },
});
