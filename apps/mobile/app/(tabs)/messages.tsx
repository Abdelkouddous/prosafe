import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  RefreshControl,
  TextInput, // Added for search input
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fetchMyMessages, fetchMyUser } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

interface Sender {
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

interface Message {
  id: string;
  title: string;
  content: string;
  sender: string | Sender;
  createdAt: string;
  read: boolean;
  priority: "low" | "medium" | "high";
}

export default function MessagesScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]); // Stores filtered messages
  const [searchQuery, setSearchQuery] = useState(""); // Stores search input
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    loadMessages();
    fetchUserData();
  }, []);

  // Update filtered messages whenever search query or original messages change
  useEffect(() => {
    filterMessages();
  }, [searchQuery, messages]);

  // Filter messages based on search query
  // Update your filterMessages function to this:
  const filterMessages = () => {
    if (!searchQuery.trim()) {
      setFilteredMessages(messages);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = messages.filter((message) => {
      // Safely check title
      if (message.title?.toLowerCase().includes(query)) return true;

      // Safely check content
      if (message.content?.toLowerCase().includes(query)) return true;

      // Safely check sender name
      try {
        const senderName = formatSenderName(message.sender)?.toLowerCase();
        if (senderName?.includes(query)) return true;
      } catch (e) {
        console.warn("Error formatting sender name:", e);
      }

      return false;
    });

    setFilteredMessages(filtered);
  };

  const formatSenderName = (sender: string | Sender) => {
    if (typeof sender === "string") {
      return sender;
    }

    if (sender.name) return sender.name;
    if (sender.firstName || sender.lastName) {
      return `${sender.firstName || ""} ${sender.lastName || ""}`.trim();
    }
    if (sender.email) return sender.email;

    return "Unknown sender";
  };

  const fetchUserData = async () => {
    try {
      if (user && user.name) {
        setUserName(user.name);
        return;
      }

      const userData = await fetchMyUser();
      let name = "";

      if (userData.user) {
        name =
          userData.user.name ||
          `${userData.user.firstName || ""} ${userData.user.lastName || ""}`.trim() ||
          userData.user.email;
      } else {
        name =
          userData.name ||
          `${userData.firstName || ""} ${userData.lastName || ""}`.trim() ||
          userData.email;
      }

      setUserName(name);
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      const data = await fetchMyMessages();
      setMessages(data);
      setFilteredMessages(data); // Initialize filtered messages with all messages
    } catch (error) {
      console.error("Error loading messages:", error);
      Alert.alert("Error", "Failed to load messages. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMessages();
    await fetchUserData();
    setRefreshing(false);
  };

  const markAsRead = (messageId: string) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === messageId ? { ...msg, read: true } : msg))
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffInDays === 0) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInDays === 1) {
      return "Yesterday";
    } else if (diffInDays < 7) {
      return date.toLocaleDateString([], { weekday: "short" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0095F6" />
        <Text style={styles.loadingText}>Loading messages...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#8E8E8E"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search messages..."
            placeholderTextColor="#8E8E8E"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredMessages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubble-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyText}>
              {searchQuery.trim() ? "No matching messages" : "No messages yet"}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery.trim()
                ? "Try a different search term"
                : "You'll receive important notifications and updates here"}
            </Text>
          </View>
        ) : (
          <View style={styles.messagesList}>
            {filteredMessages.map((message) => (
              <TouchableOpacity
                key={message.id}
                style={styles.messageCard}
                onPress={() => markAsRead(message.id)}
              >
                <View style={styles.avatarContainer}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>MSG</Text>
                  </View>
                  {!message.read && <View style={styles.unreadDot} />}
                </View>

                <View style={styles.messageContent}>
                  <Text style={styles.messageSender} numberOfLines={1}>
                    {formatSenderName(message.sender)}
                  </Text>
                  <View style={styles.messagePreview}>
                    <Text style={styles.messageTitle} numberOfLines={1}>
                      {message.title}
                    </Text>
                    <Text
                      style={[
                        styles.messageText,
                        !message.read && styles.unreadMessageText,
                      ]}
                      numberOfLines={1}
                    >
                      {message.content}
                    </Text>
                  </View>
                </View>

                <View style={styles.messageTime}>
                  <Text style={styles.timeText}>
                    {formatDate(message.createdAt)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#8E8E8E",
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EFEFEF",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#262626",
    marginBottom: 12, // Added space for search
  },
  // Search styles
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFEFEF",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#262626",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    marginTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#262626",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#8E8E8E",
    textAlign: "center",
    marginTop: 8,
  },
  messagesList: {
    padding: 0,
  },
  messageCard: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EFEFEF",
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#EFEFEF",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#262626",
  },
  unreadDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#0095F6",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  messageContent: {
    flex: 1,
    justifyContent: "center",
  },
  messageSender: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#262626",
    marginBottom: 4,
  },
  messagePreview: {
    flexDirection: "row",
    alignItems: "center",
  },
  messageTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#262626",
    marginRight: 4,
  },
  messageText: {
    fontSize: 14,
    color: "#8E8E8E",
    flex: 1,
  },
  unreadMessageText: {
    fontWeight: "500",
    color: "#262626",
  },
  messageTime: {
    minWidth: 50,
    alignItems: "flex-end",
  },
  timeText: {
    fontSize: 12,
    color: "#8E8E8E",
  },
});
