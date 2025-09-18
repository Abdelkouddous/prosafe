import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../contexts/AuthContext";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import { fetchMyMessages } from "../services/api";

interface Message {
  id: number;
  subject: string;
  content: string;
  sender: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  created_at: string;
  is_urgent: boolean;
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const data = await fetchMyMessages();
      setMessages(data || []);
    } catch (error) {
      console.error("Failed to fetch messages:", error);
      Alert.alert("Error", "Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMessages();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      backgroundColor: colors.tint,
      paddingTop: 50,
      paddingBottom: 20,
      paddingHorizontal: 20,
    },
    headerContent: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: "white",
    },
    headerSubtitle: {
      fontSize: 14,
      color: "rgba(255, 255, 255, 0.8)",
      marginTop: 4,
    },
    logoutButton: {
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      paddingHorizontal: 15,
      paddingVertical: 8,
      borderRadius: 20,
    },
    logoutText: {
      color: "white",
      fontSize: 14,
    },
    statsContainer: {
      flexDirection: "row",
      justifyContent: "space-around",
      padding: 20,
      backgroundColor: colors.background,
    },
    statCard: {
      backgroundColor: colors.tint,
      padding: 15,
      borderRadius: 10,
      alignItems: "center",
      flex: 1,
      marginHorizontal: 5,
    },
    statNumber: {
      fontSize: 24,
      fontWeight: "bold",
      color: "white",
    },
    statLabel: {
      fontSize: 12,
      color: "rgba(255, 255, 255, 0.8)",
      marginTop: 4,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: colors.text,
      marginHorizontal: 20,
      marginTop: 20,
      marginBottom: 10,
    },
    messageCard: {
      backgroundColor: colors.background,
      marginHorizontal: 20,
      marginVertical: 5,
      padding: 15,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.icon,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
    },
    urgentMessage: {
      borderColor: "#ff4444",
      borderWidth: 2,
    },
    messageHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    messageSubject: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.text,
      flex: 1,
    },
    urgentBadge: {
      backgroundColor: "#ff4444",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    urgentText: {
      color: "white",
      fontSize: 10,
      fontWeight: "bold",
    },
    messageContent: {
      fontSize: 14,
      color: colors.text,
      marginBottom: 8,
    },
    messageSender: {
      fontSize: 12,
      color: colors.icon,
    },
    emptyState: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 40,
    },
    emptyText: {
      fontSize: 16,
      color: colors.icon,
      textAlign: "center",
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Admin Dashboard</Text>
            <Text style={styles.headerSubtitle}>
              Welcome, {user?.firstName} {user?.lastName}
            </Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{messages.length}</Text>
          <Text style={styles.statLabel}>Total Messages</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {messages.filter((m) => m.is_urgent).length}
          </Text>
          <Text style={styles.statLabel}>Urgent</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Active Users</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Recent Messages</Text>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="mail-outline" size={64} color={colors.icon} />
            <Text style={styles.emptyText}>No messages available</Text>
          </View>
        ) : (
          messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageCard,
                message.is_urgent && styles.urgentMessage,
              ]}
            >
              <View style={styles.messageHeader}>
                <Text style={styles.messageSubject} numberOfLines={1}>
                  {message.subject}
                </Text>
                {message.is_urgent && (
                  <View style={styles.urgentBadge}>
                    <Text style={styles.urgentText}>URGENT</Text>
                  </View>
                )}
              </View>
              <Text style={styles.messageContent} numberOfLines={2}>
                {message.content}
              </Text>
              <Text style={styles.messageSender}>
                From: {message.sender.firstName} {message.sender.lastName}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
