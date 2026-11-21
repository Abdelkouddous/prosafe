import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppTheme } from "@/contexts/AccessibilityContext";
import {
  ChatMessage,
  Conversation,
  fetchConversation,
  fetchThread,
  markConversationRead,
  personName,
  sendMessage,
} from "@/services/messagingApi";
import { isRealtimeConnected, onRealtime, onRealtimeStatus } from "@/services/realtime";

const POLL_MS = 15000;

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { t, isRTL, currentLanguage } = useLanguage();
  const { colors, fs } = useAppTheme();
  const [conv, setConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(false);
  const [live, setLive] = useState(isRealtimeConnected());
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const myId = user?.id !== undefined ? Number(user.id) : NaN;
  const convId = Number(id);

  const loadThread = useCallback(async () => {
    try {
      const list = await fetchThread(id);
      setMessages(list);
      setError(false);
      markConversationRead(id).catch(() => {});
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadThread();
    fetchConversation(id).then(setConv).catch(() => {});
  }, [id, loadThread]);

  useEffect(() => {
    const offStatus = onRealtimeStatus(setLive);
    const offMsg = onRealtime("message:new", (p: { conversationId: number; message: ChatMessage }) => {
      if (Number(p?.conversationId) !== convId || !p.message) return;
      setMessages((prev) => (prev.some((m) => m.id === p.message.id) ? prev : [...prev, p.message]));
      if (p.message.senderId !== myId) markConversationRead(id).catch(() => {});
    });
    // Polling fallback while the socket is down
    const timer = setInterval(() => {
      if (!isRealtimeConnected()) loadThread();
    }, POLL_MS);
    return () => {
      offStatus();
      offMsg();
      clearInterval(timer);
    };
  }, [id, convId, myId, loadThread]);

  const send = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setSendError(false);
    try {
      const msg = await sendMessage(id, body);
      setText("");
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
    } catch {
      setSendError(true);
    } finally {
      setSending(false);
    }
  };

  const others = conv?.participants.filter((p) => p.id !== myId).map(personName).filter(Boolean).join(", ");
  const back = () => (router.canGoBack() ? router.back() : router.replace("/(tabs)/messages"));
  const time = (d: string) =>
    new Date(d).toLocaleString(currentLanguage, {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background, direction: isRTL ? "rtl" : "ltr" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.topBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TouchableOpacity onPress={back} accessibilityRole="button" style={{ padding: 6 }}>
          <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontSize: fs(17), fontWeight: "700" }} numberOfLines={1}>
            {conv?.subject ?? t("messagesConversations")}
          </Text>
          {!!others && (
            <Text style={{ color: colors.textSecondary, fontSize: fs(12) }} numberOfLines={1}>
              {others}
            </Text>
          )}
        </View>
        <Text style={{ color: live ? colors.success : colors.textSecondary, fontSize: fs(11) }}>
          {live ? t("messagesLive") : t("messagesOffline")}
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 30 }} color={colors.primary} size="large" />
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => String(m.id)}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          ListHeaderComponent={
            error ? (
              <Text style={{ color: colors.danger, fontSize: fs(13), padding: 8 }}>{t("messagesLoadFailed")}</Text>
            ) : null
          }
          ListEmptyComponent={
            error ? null : (
              <Text style={{ color: colors.textSecondary, textAlign: "center", marginTop: 30, fontSize: fs(14) }}>
                {t("messagesNoMessagesYet")}
              </Text>
            )
          }
          renderItem={({ item }) => {
            const mine = item.senderId === myId;
            return (
              <View style={[styles.bubbleWrap, { alignItems: mine ? "flex-end" : "flex-start" }]}>
                <View
                  style={[
                    styles.bubble,
                    mine
                      ? { backgroundColor: colors.primary }
                      : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
                  ]}
                >
                  {!mine && (
                    <Text style={{ color: colors.primary, fontSize: fs(12), fontWeight: "700" }}>
                      {personName(item.sender) || t("messagesUnknownSender")}
                    </Text>
                  )}
                  <Text style={{ color: mine ? "#FFFFFF" : colors.text, fontSize: fs(15) }}>{item.body}</Text>
                  <Text
                    style={{
                      color: mine ? "#DBEAFE" : colors.textSecondary,
                      fontSize: fs(10),
                      marginTop: 2,
                      alignSelf: "flex-end",
                    }}
                  >
                    {time(item.createdAt)}
                  </Text>
                </View>
              </View>
            );
          }}
        />
      )}

      {sendError && (
        <Text style={{ color: colors.danger, fontSize: fs(13), paddingHorizontal: 12 }}>
          {t("messagesSendFailed")}
        </Text>
      )}
      <View style={[styles.composer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={t("messagesTypeMessage")}
          placeholderTextColor={colors.textSecondary}
          multiline
          maxLength={5000}
          style={[styles.input, { color: colors.text, borderColor: colors.border, fontSize: fs(15), textAlign: isRTL ? "right" : "left" }]}
        />
        <TouchableOpacity
          onPress={send}
          disabled={sending || !text.trim()}
          accessibilityRole="button"
          accessibilityLabel={t("messagesSend")}
          style={[styles.sendBtn, { backgroundColor: colors.primary, opacity: sending || !text.trim() ? 0.5 : 1 }]}
        >
          {sending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Ionicons name="send" size={20} color="#FFFFFF" style={isRTL ? { transform: [{ scaleX: -1 }] } : undefined} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 50,
    paddingBottom: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  list: { padding: 12, flexGrow: 1 },
  bubbleWrap: { marginBottom: 8 },
  bubble: { maxWidth: "80%", borderRadius: 14, paddingVertical: 8, paddingHorizontal: 12 },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    padding: 8,
    borderTopWidth: 1,
  },
  input: { flex: 1, maxHeight: 120, borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  sendBtn: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
});
