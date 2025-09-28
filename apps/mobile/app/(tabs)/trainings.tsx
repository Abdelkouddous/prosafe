import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { trainingApi, Training } from "../services/trainingApi";

export default function TrainingsScreen() {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch training data from the API
  const fetchTrainings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await trainingApi.getAllTrainings();

      // Handle the response structure from backend
      if (response && response.tasks) {
        setTrainings(response.tasks);
      } else if (Array.isArray(response)) {
        setTrainings(response);
      } else {
        setTrainings([]);
      }
    } catch (error) {
      console.error("Error fetching trainings:", error);
      setError("Failed to load trainings. Please try again.");
      setTrainings([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainings();
  }, []);

  const handleCompleteTraining = async (trainingId: number) => {
    try {
      await trainingApi.completeTraining(trainingId);
      Alert.alert("Success", "Training marked as completed!");
      // Refresh the training list
      fetchTrainings();
    } catch (error) {
      console.error("Error completing training:", error);
      Alert.alert("Error", "Failed to complete training. Please try again.");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return { backgroundColor: "#d4edda", color: "#155724" };
      case "In Progress":
        return { backgroundColor: "#d1ecf1", color: "#0c5460" };
      case "Pending":
        return { backgroundColor: "#fff3cd", color: "#856404" };
      case "Expired":
      case "Overdue":
        return { backgroundColor: "#f8d7da", color: "#721c24" };
      default:
        return { backgroundColor: "#e2e3e5", color: "#383d41" };
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No due date";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>PROSAFE</Text>
            <Text style={styles.logoSubtext}>TRAININGS</Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#28a745" />
            <Text style={styles.loadingText}>Loading trainings...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={fetchTrainings}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : trainings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No trainings assigned to you yet.
            </Text>
          </View>
        ) : (
          trainings.map((training) => (
            <TouchableOpacity key={training.id} style={styles.formationCard}>
              <Text style={styles.formationTitle}>{training.title}</Text>
              <Text style={styles.formationDescription}>
                {training.description}
              </Text>
              <View style={styles.formationDetails}>
                <Text style={styles.duration}>
                  Due: {formatDate(training.dueDate)}
                </Text>
                <Text style={[styles.status, getStatusColor(training.status)]}>
                  {training.status}
                </Text>
              </View>
              <View style={styles.formationDetails}>
                <Text style={styles.priority}>
                  Priority: {training.priority}
                </Text>
                {training.status !== "Completed" && (
                  <TouchableOpacity
                    style={styles.completeButton}
                    onPress={() => handleCompleteTraining(training.id)}
                  >
                    <Text style={styles.completeButtonText}>Mark Complete</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
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
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: "white",
    opacity: 0.9,
  },
  content: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  errorText: {
    fontSize: 16,
    color: "#dc3545",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#28a745",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  formationCard: {
    backgroundColor: "white",
    padding: 20,
    marginBottom: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  formationTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  formationDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
    lineHeight: 20,
  },
  formationDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  duration: {
    fontSize: 12,
    color: "#888",
    fontStyle: "italic",
  },
  priority: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  status: {
    fontSize: 12,
    fontWeight: "600",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completeButton: {
    backgroundColor: "#28a745",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
  },
  completeButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  available: {
    backgroundColor: "#d4edda",
    color: "#155724",
  },
  comingSoon: {
    backgroundColor: "#fff3cd",
    color: "#856404",
  },
});
