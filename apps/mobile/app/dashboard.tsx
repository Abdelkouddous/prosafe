// Top-level imports
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "./contexts/AuthContext";
import {
  adminApi,
  AdminDashboardStats,
  AdminAlert,
  AdminTask,
  AdminInventoryItem,
  AdminMessage,
  AdminIncident,
} from "./services/adminAdminApi";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function AdminDashboardScreen() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [alerts, setAlerts] = useState<AdminAlert[]>([]);
  const [tasks, setTasks] = useState<AdminTask[]>([]);
  const [lowStock, setLowStock] = useState<AdminInventoryItem[]>([]);
  const [incidents, setIncidents] = useState<AdminIncident[]>([]);
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [
        statsRes,
        alertsRes,
        tasksRes,
        lowStockRes,
        incidentsRes,
        unreadMessagesRes,
      ] = await Promise.all([
        adminApi.getDashboardStats(),
        adminApi.getAlerts(1, 5),
        adminApi.getTasks(),
        adminApi.getLowStockItems(),
        adminApi.getIncidents(),
        adminApi.getUnreadMessages(),
      ]);
      setStats(statsRes.data);
      setAlerts(alertsRes.data.items || []);
      setTasks(tasksRes.data || []);
      setLowStock(lowStockRes.data || []);
      setIncidents(incidentsRes.data || []);
      setMessages(unreadMessagesRes.data || []);
    } catch (e) {
      console.error("Failed to load admin dashboard", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role !== "admin") {
      router.replace("/(tabs)/menu");
      return;
    }
    loadData();
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Add logout handler
  const onLogoutPress = async () => {
    try {
      await logout();
      router.replace("/login");
    } catch (e) {
      console.error("Logout failed", e);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>PROSAFE</Text>
              <Text style={styles.logoSubtext}>NEW INCIDENT</Text>
            </View>
          </View>
          <View style={styles.logoutContainer}>
            <Text style={styles.logoutButton}>Logout</Text>
            <TouchableOpacity
              onPress={onLogoutPress}
              accessibilityRole="button"
              accessibilityLabel="Logout"
              style={styles.logoutButton}
            >
              <Ionicons name="power" size={22} color="#DC2626"></Ionicons>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      {stats && (
        <View>
          {/* Header with Logo */}

          <View style={styles.grid}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Users</Text>
              <Text style={styles.cardValue}>{stats.totalUsers}</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Tasks</Text>
              <Text style={styles.cardValue}>{stats.totalTasks}</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Incidents</Text>
              <Text style={styles.cardValue}>{stats.totalIncidents}</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Unread Messages</Text>
              <Text style={styles.cardValue}>{stats.messages.unreadCount}</Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Alerts</Text>
        {alerts.length === 0 ? (
          <Text style={styles.empty}>No alerts</Text>
        ) : (
          alerts.map((a) => (
            <View key={a.id} style={styles.row}>
              <Text style={styles.rowTitle}>{a.title}</Text>
              <Text style={styles.rowMeta}>
                {a.severity} • {a.status}
              </Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tasks</Text>
        {tasks.length === 0 ? (
          <Text style={styles.empty}>No tasks</Text>
        ) : (
          tasks.slice(0, 5).map((t) => (
            <View key={t.id} style={styles.row}>
              <Text style={styles.rowTitle}>{t.title}</Text>
              <Text style={styles.rowMeta}>
                {t.priority} • {t.status}
              </Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Low Stock</Text>
        {lowStock.length === 0 ? (
          <Text style={styles.empty}>No low stock items</Text>
        ) : (
          lowStock.slice(0, 5).map((i) => (
            <View key={i.id} style={styles.row}>
              <Text style={styles.rowTitle}>{i.name}</Text>
              <Text style={styles.rowMeta}>
                Qty {i.quantity} • Min {i.min_stock_level}
              </Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Active Incidents</Text>
        {incidents.length === 0 ? (
          <Text style={styles.empty}>No active incidents</Text>
        ) : (
          incidents.slice(0, 5).map((i) => (
            <View key={i.id} style={styles.row}>
              <Text style={styles.rowTitle}>{i.title}</Text>
              <Text style={styles.rowMeta}>
                {i.severity} • {i.status} • {i.location}
              </Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Unread Messages</Text>
        {messages.length === 0 ? (
          <Text style={styles.empty}>All read</Text>
        ) : (
          messages.slice(0, 5).map((m) => (
            <View key={m.id} style={styles.row}>
              <Text style={styles.rowTitle}>{m.subject}</Text>
              <Text style={styles.rowMeta}>
                {m.is_urgent ? "URGENT" : ""} •{" "}
                {new Date(m.created_at).toLocaleString()}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  logoutContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    fontSize: 14,
    fontWeight: "500",
    marginTop: 12,
  },

  container: {
    flex: 1,
  },
  header: {
    backgroundColor: "#FFFFFF",
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
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  container: { flex: 1, backgroundColor: "#F3F4F6" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  // header: { fontSize: 24, fontWeight: "700", margin: 16 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  card: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
  },
  cardTitle: { fontSize: 14, color: "#374151" },
  cardValue: { fontSize: 22, fontWeight: "700", color: "#111827" },
  section: {
    backgroundColor: "#fff",
    margin: 16,
    borderRadius: 12,
    padding: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 8 },
  row: {
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  rowTitle: { fontSize: 16, fontWeight: "500" },
  rowMeta: { fontSize: 12, color: "#6B7280" },
  empty: { color: "#6B7280" },
  logoSubtext: {
    fontSize: 10,
    color: "#6B7280",
    letterSpacing: 1,
    marginTop: 2,
  },
  loadingText: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 12,
  },
  headerRow: {
    fontSize: 24,
    fontWeight: "bold",
  },
  logoutButton: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    fontSize: 14,
    color: "#DC2626",
    fontWeight: "500",
    marginTop: 12,
  },
});
