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
  TextInput,
  Modal,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fetchMyMessages, fetchMyUser } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

const { width } = Dimensions.get("window");

interface Sender {
  id?: number;
  firstName?: string;
  lastName?: string;
  email?: string;
}

interface Message {
  id: string;
  subject?: string; // Backend uses 'subject' instead of 'title'
  content: string;
  sender?: Sender | null; // Can be null for system messages
  system_sender?: string; // For system messages like "Prosafe Admin"
  created_at: string;
  status?: string; // Backend uses 'status' instead of 'read'
  is_urgent?: boolean; // Backend field
  priority?: "low" | "medium" | "high"; // Keep for compatibility
}

export default function MessagesScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]); // Stores filtered messages
  const [searchQuery, setSearchQuery] = useState(""); // Stores search input
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
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
      // Safely check title (use subject if title doesn't exist)
      if (message.subject?.toLowerCase().includes(query)) return true;

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

  const formatSenderName = (sender: string | Sender | null | undefined) => {
    if (typeof sender === "string") {
      return sender;
    }

    // Handle null or undefined sender
    if (!sender) {
      return "System";
    }

    // if (sender.name) return sender.name;
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
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, status: "read" } : msg
      )
    );
  };

  const openMessageModal = (message: Message) => {
    setSelectedMessage(message);
    setModalVisible(true);
    markAsRead(message.id);
  };

  const closeMessageModal = () => {
    setModalVisible(false);
    setSelectedMessage(null);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Invalid Date";

    const date = new Date(dateString);

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return "Invalid Date";
    }

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
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>PROSAFE</Text>
            <Text style={styles.logoSubtext}>MESSAGES</Text>
          </View>
        </View>
      </View>

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
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#8E8E8E"
        />
      </View>

      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
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
                onPress={() => openMessageModal(message)}
              >
                <View style={styles.avatarContainer}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>MSG</Text>
                  </View>
                  {message.status !== "read" && (
                    <View style={styles.unreadDot} />
                  )}
                </View>

                <View style={styles.messageContent}>
                  <Text style={styles.messageSender} numberOfLines={1}>
                    {formatSenderName(message.sender)}
                  </Text>
                  <View style={styles.messagePreview}>
                    <Text style={styles.messageTitle} numberOfLines={1}>
                      {message.subject || "No Subject"}
                    </Text>
                    <Text
                      style={[
                        styles.messageText,
                        message.status !== "read" && styles.unreadMessageText,
                      ]}
                      numberOfLines={1}
                    >
                      {message.content}
                    </Text>
                  </View>
                </View>

                <View style={styles.messageTime}>
                  <Text style={styles.timeText}>
                    {formatDate(message.created_at)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Message Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeMessageModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={closeMessageModal}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Message Details</Text>
              <View style={{ width: 24 }} />
            </View>

            {selectedMessage && (
              <ScrollView style={styles.modalBody}>
                <Text style={styles.modalSender}>
                  {selectedMessage.system_sender || formatSenderName(selectedMessage.sender)}
                </Text>
                
                <Text style={styles.modalMessageContent}>
                  {selectedMessage.content || "No content available"}
                </Text>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  scrollContent: {
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
  logoSubtext: {
    fontSize: 10,
    color: "#6B7280",
    letterSpacing: 1,
    marginTop: 2,
  },
  searchButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 20,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#262626",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#8E8E8E",
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
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginVertical: 5,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#4A90E2",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  unreadDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#DC2626",
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
    color: "#1F2937",
    marginBottom: 4,
  },
  messagePreview: {
    flexDirection: "row",
    alignItems: "center",
  },
  messageTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1F2937",
    marginRight: 4,
  },
  messageText: {
    fontSize: 14,
    color: "#6B7280",
    flex: 1,
  },
  unreadMessageText: {
    fontWeight: "500",
    color: "#1F2937",
  },
  messageTime: {
    minWidth: 50,
    alignItems: "flex-end",
  },
  timeText: {
    fontSize: 12,
    color: "#6B7280",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    margin: 20,
    maxHeight: "80%",
    width: width - 40,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    flex: 1,
    textAlign: "center",
  },
  modalBody: {
    flex: 1,
  },
  modalSender: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalMessageContent: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 22,
  },
});
