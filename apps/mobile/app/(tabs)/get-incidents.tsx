import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api, { fetchMyRewardsSummary } from "../services/api";
import { RefreshControl } from "react-native-gesture-handler";
import * as Location from "expo-location";

interface UserIncident {
  id: string;
  description: string;
  type: IncidentType;
  severity: IncidentSeverity;
  status: "pending" | "investigating" | "resolved" | "closed";
  manualAddress?: string;
  geoLatitude?: number;
  geoLongitude?: number;
  createdAt: string;
  updatedAt: string;
}

enum IncidentType {
  SAFETY = "safety",
  SECURITY = "security",
  HR_VIOLATION = "hr_violation",
}

enum IncidentSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

const GetIncidents = () => {
  const [userIncidents, setUserIncidents] = useState<UserIncident[]>([]);
  const [isLoadingIncidents, setIsLoadingIncidents] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredIncidents, setFilteredIncidents] = useState<UserIncident[]>(
    []
  );
  const [refreshing, setRefreshing] = useState(false);

  const [totalPoints, setTotalPoints] = useState<number>(0);
  const [addressCache, setAddressCache] = useState<Record<string, string>>({});
  const formatAddress = (a: Location.LocationGeocodedAddress) => {
    const parts = [
      a.name || a.street,
      a.city,
      a.region,
      a.postalCode,
      a.country,
    ].filter(Boolean);
    return parts.join(", ");
  };

  useEffect(() => {
    const loadAddresses = async () => {
      const toFetch = userIncidents.filter(
        (i) =>
          i.geoLatitude &&
          i.geoLongitude &&
          !i.manualAddress &&
          !addressCache[i.id]
      );

      for (const incident of toFetch) {
        try {
          const res = await Location.reverseGeocodeAsync({
            latitude: incident.geoLatitude as number,
            longitude: incident.geoLongitude as number,
          });
          const addr =
            res && res[0]
              ? formatAddress(res[0])
              : `${incident.geoLatitude?.toFixed(6)}, ${incident.geoLongitude?.toFixed(6)}`;

          setAddressCache((prev) => ({ ...prev, [incident.id]: addr }));
        } catch {
          // silent fail; keep coordinates if reverse geocode fails
        }
      }
    };

    loadAddresses();
  }, [userIncidents]);
  useEffect(() => {
    const loadRewards = async () => {
      try {
        const summary = await fetchMyRewardsSummary();
        if (summary && typeof summary.totalPoints === "number") {
          setTotalPoints(summary.totalPoints);
        }
      } catch (e) {
        // silent fail for UI
      }
    };

    loadRewards();
    fetchUserIncidents();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredIncidents(userIncidents);
    } else {
      const filtered = userIncidents.filter(
        (incident) =>
          incident.description
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          incident.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
          incident.severity.toLowerCase().includes(searchQuery.toLowerCase()) ||
          incident.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (incident.manualAddress &&
            incident.manualAddress
              .toLowerCase()
              .includes(searchQuery.toLowerCase()))
      );
      setFilteredIncidents(filtered);
    }
  }, [searchQuery, userIncidents]);

  const fetchUserIncidents = async () => {
    try {
      setIsLoadingIncidents(true);
      const response = await api.get("/incidents");

      if (response.data && Array.isArray(response.data)) {
        setUserIncidents(response.data);
        setFilteredIncidents(response.data);
      } else {
        console.warn("Unexpected response format:", response.data);
        setUserIncidents([]);
        setFilteredIncidents([]);
      }
    } catch (error: any) {
      console.error("Error fetching incidents:", error);
      setUserIncidents([]);
      setFilteredIncidents([]);
    } finally {
      setIsLoadingIncidents(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserIncidents();
    setRefreshing(false);
  };

  const getTypeLabel = (type: IncidentType) => {
    switch (type) {
      case IncidentType.SAFETY:
        return "Safety";
      case IncidentType.SECURITY:
        return "Security";
      case IncidentType.HR_VIOLATION:
        return "HR Violation";
      default:
        return "Unknown";
    }
  };

  const getSeverityLabel = (severity: IncidentSeverity) => {
    switch (severity) {
      case IncidentSeverity.LOW:
        return "Low";
      case IncidentSeverity.MEDIUM:
        return "Medium";
      case IncidentSeverity.HIGH:
        return "High";
      case IncidentSeverity.CRITICAL:
        return "Critical";
      default:
        return "Normal";
    }
  };

  const getSeverityColor = (severity: IncidentSeverity) => {
    switch (severity) {
      case IncidentSeverity.LOW:
        return "#10B981";
      case IncidentSeverity.MEDIUM:
        return "#F59E0B";
      case IncidentSeverity.HIGH:
        return "#EF4444";
      case IncidentSeverity.CRITICAL:
        return "#DC2626";
      default:
        return "#6B7280";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "#F59E0B";
      case "investigating":
        return "#3B82F6";
      case "resolved":
        return "#10B981";
      case "closed":
        return "#6B7280";
      default:
        return "#6B7280";
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return (
        date.toLocaleDateString() +
        " " +
        date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    } catch (error) {
      return "Invalid Date";
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  const renderIncidentItem = ({ item }: { item: UserIncident }) => (
    <View style={styles.incidentCard}>
      <View style={styles.incidentHeader}>
        <Text style={styles.incidentType}>{getTypeLabel(item.type)}</Text>
        <View style={styles.badgeContainer}>
          <View
            style={[
              styles.severityBadge,
              { backgroundColor: getSeverityColor(item.severity) },
            ]}
          >
            <Text style={styles.severityText}>
              {getSeverityLabel(item.severity)}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          >
            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.incidentDescription} numberOfLines={3}>
        {item.description}
      </Text>

      {item.manualAddress ? (
        <Text style={styles.incidentLocation}>📍 {item.manualAddress}</Text>
      ) : addressCache[item.id] ? (
        <Text style={styles.incidentLocation}>📍 {addressCache[item.id]}</Text>
      ) : null}

      {/* {item.geoLatitude && item.geoLongitude && (
        <Text style={styles.incidentCoordinates}>
          🌍 {item.geoLatitude.toFixed(6)}, {item.geoLongitude.toFixed(6)}
        </Text>
      )} */}

      <View style={styles.incidentFooter}>
        <Text style={styles.incidentDate}>
          Created: {formatDate(item.createdAt)}
        </Text>
        {item.updatedAt !== item.createdAt && (
          <Text style={styles.incidentDate}>
            Updated: {formatDate(item.updatedAt)}
          </Text>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>PROSAFE</Text>
            <Text style={styles.logoSubtext}>RECENT INCIDENTS</Text>
          </View>
        </View>
      </View>

      {/* Rewards Summary */}
      <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
        <View
          style={{
            backgroundColor: "#F3F4F6",
            borderRadius: 12,
            padding: 12,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "600", color: "#111827" }}>
            Points
          </Text>
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#DC2626" }}>
            {totalPoints} pts
          </Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#6B7280"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search incidents..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Incidents List */}
      <View style={styles.incidentsContainer}>
        <Text style={styles.sectionTitle}>
          My Incidents ({filteredIncidents.length})
        </Text>

        {isLoadingIncidents ? (
          <ActivityIndicator
            size="large"
            color="#DC2626"
            style={styles.loader}
          />
        ) : (
          <FlatList
            data={filteredIncidents}
            renderItem={renderIncidentItem}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <Text style={styles.noIncidents}>
                {searchQuery
                  ? "No incidents match your search."
                  : "No incidents found."}
              </Text>
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
};

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
  searchContainer: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: "#1F2937",
  },
  clearButton: {
    padding: 4,
  },
  incidentsContainer: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 16,
  },
  loader: {
    marginVertical: 20,
  },
  incidentCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  incidentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  incidentType: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    flex: 1,
  },
  badgeContainer: {
    flexDirection: "row",
    gap: 8,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  incidentDescription: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
    lineHeight: 20,
  },
  incidentLocation: {
    fontSize: 12,
    color: "#10B981",
    marginBottom: 4,
  },
  incidentCoordinates: {
    fontSize: 12,
    color: "#3B82F6",
    marginBottom: 4,
  },
  incidentFooter: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  incidentDate: {
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 2,
  },
  noIncidents: {
    textAlign: "center",
    color: "#6B7280",
    fontSize: 16,
    marginVertical: 40,
    fontStyle: "italic",
  },
});

export default GetIncidents;
