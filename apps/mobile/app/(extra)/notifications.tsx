import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { routeForNotification } from "@/services/push";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  AppNotification,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/services/notificationApi";
import { useThemedStyles } from "@/hooks/useThemedStyles";

const PAGE_SIZE = 20;

export default function NotificationsScreen() {
  const styles = useThemedStyles(baseStyles);
  const { t, isRTL, currentLanguage } = useLanguage();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async (target: number, append: boolean) => {
    try {
      const res = await fetchNotifications({ page: target, limit: PAGE_SIZE });
      setItems((cur) => (append ? [...cur, ...res.data] : res.data));
      setTotal(res.total);
      setPage(target);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load(1, false);
  }, [load]);

  const onEnd = () => {
    if (loading || loadingMore || error || items.length >= total) return;
    setLoadingMore(true);
    load(page + 1, true);
  };

  const markRead = async (n: AppNotification) => {
    if (n.readAt) return;
    setItems((cur) => cur.map((x) => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x)));
    try {
      await markNotificationRead(n.id);
    } catch {
      setItems((cur) => cur.map((x) => (x.id === n.id ? { ...x, readAt: null } : x)));
    }
  };

  const open = async (n: AppNotification) => {
    markRead(n);
    routeForNotification(n.type, n.data);
  };

  const markAll = async () => {
    const prev = items;
    const now = new Date().toISOString();
    setItems((cur) => cur.map((x) => ({ ...x, readAt: x.readAt ?? now })));
    try {
      await markAllNotificationsRead();
    } catch {
      setItems(prev);
    }
  };

  const back = () => (router.canGoBack() ? router.back() : router.replace("/(tabs)/home"));
  const hasUnread = items.some((n) => !n.readAt);

  const renderItem = ({ item }: { item: AppNotification }) => {
    const unread = !item.readAt;
    return (
      <TouchableOpacity
        style={[styles.card, unread && styles.cardUnread]}
        onPress={() => open(item)}
        onLongPress={() => markRead(item)}
      >
        <View
          style={[
            styles.dot,
            { backgroundColor: unread ? (item.type === "emergency" ? "#DC2626" : "#EA580C") : "transparent" },
          ]}
        />
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, unread && styles.titleUnread]}>{item.title}</Text>
          <Text style={styles.body}>{item.body}</Text>
          <Text style={styles.date}>{new Date(item.createdAt).toLocaleString(currentLanguage)}</Text>
        </View>
        {unread && (
          <TouchableOpacity
            onPress={() => markRead(item)}
            accessibilityLabel={t("markRead")}
            style={styles.readBtn}
          >
            <Ionicons name="checkmark-circle-outline" size={24} color="#16A34A" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { direction: isRTL ? "rtl" : "ltr" }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={back} style={styles.backBtn} accessibilityRole="button">
          <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>{t("notifications")}</Text>
        {hasUnread && (
          <TouchableOpacity onPress={markAll}>
            <Text style={styles.link}>{t("markAllRead")}</Text>
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={items}
        keyExtractor={(n) => String(n.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load(1, false);
            }}
          />
        }
        onEndReached={onEnd}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator style={styles.center} size="large" color="#2563EB" />
          ) : error ? (
            <View style={styles.center}>
              <Text style={styles.errorText}>{t("loadFailed")}</Text>
              <TouchableOpacity onPress={() => { setLoading(true); load(1, false); }}>
                <Text style={styles.link}>{t("retry")}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={[styles.center, styles.empty]}>{t("noNotifications")}</Text>
          )
        }
        ListFooterComponent={loadingMore ? <ActivityIndicator style={{ margin: 16 }} /> : null}
      />
    </View>
  );
}

const baseStyles = StyleSheet.create({
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
  topTitle: { flex: 1, fontSize: 18, fontWeight: "700", color: "#1F2937" },
  link: { color: "#2563EB", fontSize: 14, fontWeight: "600" },
  list: { padding: 12 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  cardUnread: { borderLeftWidth: 4, borderLeftColor: "#EA580C", backgroundColor: "#FFF7ED" },
  dot: { width: 10, height: 10, borderRadius: 5 },
  title: { fontSize: 15, color: "#374151" },
  titleUnread: { fontWeight: "700", color: "#111827" },
  body: { fontSize: 14, color: "#4B5563", marginTop: 2 },
  date: { fontSize: 12, color: "#9CA3AF", marginTop: 4 },
  readBtn: { padding: 4 },
  center: { alignItems: "center", marginTop: 40 },
  empty: { color: "#6B7280", fontSize: 15, textAlign: "center" },
  errorText: { color: "#DC2626", fontSize: 15, marginBottom: 8 },
});
