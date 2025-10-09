import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
  ScrollView,
  Modal,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import api from "../services/api";

// Enums matching backend
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

interface IncidentForm {
  description: string;
  type: IncidentType | "";
  severity: IncidentSeverity | "";
  location: {
    lat?: number;
    long?: number;
    manualAddress: string;
  };
  date?: string;
  photo?: ImagePicker.ImagePickerAsset;
}

// function CreateIncident() component
const CreateIncident = () => {
  const [form, setForm] = useState<IncidentForm>({
    description: "",
    type: "",
    severity: "",
    location: {
      manualAddress: "",
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeolocating, setIsGeolocating] = useState(false);

  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const [isSeverityOpen, setIsSeverityOpen] = useState(false);

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    try {
      const { status: cameraStatus } =
        await ImagePicker.requestCameraPermissionsAsync();
      const { status: mediaStatus } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      const { status: locationStatus } =
        await Location.requestForegroundPermissionsAsync();

      if (cameraStatus !== "granted" || mediaStatus !== "granted") {
        Alert.alert(
          "Permissions Required",
          "Camera and photo library access are needed to attach photos to incidents."
        );
      }

      if (locationStatus !== "granted") {
        Alert.alert(
          "Location Permission",
          "Location access helps provide accurate incident reporting."
        );
      }
    } catch (error) {
      console.error("Error requesting permissions:", error);
    }
  };

  const formatAddress = (a: Location.LocationGeocodedAddress) => {
    const parts = [a.name || a.street, a.city, a.region, a.postalCode, a.country].filter(Boolean);
    return parts.join(", ");
  };

  const getGeolocation = async () => {
    try {
      setIsGeolocating(true);

      // Ensure permission is granted before requesting location
      let perm = await Location.getForegroundPermissionsAsync();
      if (!perm.granted) {
        perm = await Location.requestForegroundPermissionsAsync();
        if (!perm.granted) {
          Alert.alert("Location Permission", "Please allow location access to use current location.");
          return;
        }
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = current.coords;

      setForm((prev) => ({
        ...prev,
        location: {
          ...prev.location,
          lat: latitude,
          long: longitude,
        },
      }));

      // Reverse geocode to auto-fill the address text input
      try {
        const res = await Location.reverseGeocodeAsync({ latitude, longitude });
        const addr = res && res[0] ? formatAddress(res[0]) : "";
        if (addr) {
          setForm((prev) => ({
            ...prev,
            location: { ...prev.location, manualAddress: addr },
          }));
        }
      } catch {
        // If reverse geocoding fails, leave the address empty; coordinates still set
      }
    } catch (error) {
      console.error("Error getting location:", error);
      Alert.alert("Location Error", "Unable to get current location");
    } finally {
      setIsGeolocating(false);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setForm((prev) => ({ ...prev, photo: result.assets[0] }));
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const removePhoto = () => {
    setForm((prev) => ({ ...prev, photo: undefined }));
  };

  const submitIncident = async () => {
    if (!form.description.trim() || !form.type || !form.severity) {
      Alert.alert("Missing Information", "Please fill in all required fields");
      return;
    }

    try {
      setIsSubmitting(true);

      const formData = new FormData();
      formData.append("description", form.description);
      formData.append("type", form.type);
      formData.append("severity", form.severity);
      formData.append("date", new Date().toISOString());

      // Location data needs to be nested under 'location' object
      if (form.location.lat && form.location.long) {
        formData.append("location[lat]", form.location.lat.toString());
        formData.append("location[long]", form.location.long.toString());
      }
      if (form.location.manualAddress) {
        formData.append("location[manualAddress]", form.location.manualAddress);
      }

      if (form.photo) {
        formData.append("photo", {
          uri: form.photo.uri,
          type: "image/jpeg",
          name: "incident-photo.jpg",
        } as any);
      }

      const response = await api.post("/incidents", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.status === 201) {
        const reward = response.data?.reward;
        const pointsMsg =
          reward && reward.pointsAwarded > 0
            ? `You earned ${reward.pointsAwarded} points! Total: ${reward.totalPoints}.`
            : undefined;

        Alert.alert(
          "Success",
          pointsMsg
            ? `Incident reported successfully.\n${pointsMsg}`
            : "Incident reported successfully",
          [
            {
              text: "OK",
              onPress: () => {
                setForm({
                  description: "",
                  type: "",
                  severity: "",
                  location: { manualAddress: "" },
                });
              },
            },
          ]
        );
      }
    } catch (error: any) {
      console.error("Error submitting incident:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to submit incident"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>PROSAFE</Text>
              <Text style={styles.logoSubtext}>NEW INCIDENT</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Report New Incident</Text>

        <View style={styles.form}>
          {/* Description */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Describe the incident in detail..."
              value={form.description}
              onChangeText={(text) =>
                setForm((prev) => ({ ...prev, description: text }))
              }
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Type */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Incident Type *</Text>
            <TouchableOpacity
              style={styles.selectInput}
              onPress={() => {
                setIsSeverityOpen(false);
                setIsTypeOpen(true);
              }}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.selectText,
                  !form.type && styles.selectPlaceholder,
                ]}
              >
                {getTypeLabel(form.type)}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Severity */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Severity *</Text>
            <TouchableOpacity
              style={styles.selectInput}
              onPress={() => {
                setIsTypeOpen(false);
                setIsSeverityOpen(true);
              }}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.selectText,
                  !form.severity && styles.selectPlaceholder,
                ]}
              >
                {getSeverityLabel(form.severity)}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Type Selector Modal */}
          <Modal transparent animationType="fade" visible={isTypeOpen}>
            <TouchableOpacity
              style={styles.dropdownOverlay}
              activeOpacity={1}
              onPress={() => setIsTypeOpen(false)}
            >
              <View style={styles.dropdownSheet}>
                <Text style={styles.dropdownTitle}>Select Incident Type</Text>
                {[
                  { label: "Safety", value: IncidentType.SAFETY },
                  { label: "Security", value: IncidentType.SECURITY },
                  { label: "HR Violation", value: IncidentType.HR_VIOLATION },
                ].map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={styles.dropdownOption}
                    onPress={() => {
                      setForm((prev) => ({ ...prev, type: opt.value }));
                      setIsTypeOpen(false);
                    }}
                  >
                    <Text style={styles.dropdownOptionText}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableOpacity>
          </Modal>

          {/* Severity Selector Modal */}
          <Modal transparent animationType="fade" visible={isSeverityOpen}>
            <TouchableOpacity
              style={styles.dropdownOverlay}
              activeOpacity={1}
              onPress={() => setIsSeverityOpen(false)}
            >
              <View style={styles.dropdownSheet}>
                <Text style={styles.dropdownTitle}>Select Severity</Text>
                {[
                  { label: "Low", value: IncidentSeverity.LOW },
                  { label: "Medium", value: IncidentSeverity.MEDIUM },
                  { label: "High", value: IncidentSeverity.HIGH },
                  { label: "Critical", value: IncidentSeverity.CRITICAL },
                ].map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={styles.dropdownOption}
                    onPress={() => {
                      setForm((prev) => ({ ...prev, severity: opt.value }));
                      setIsSeverityOpen(false);
                    }}
                  >
                    <Text style={styles.dropdownOptionText}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableOpacity>
          </Modal>

          {/* Location */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              placeholder="Incident address"
              value={form.location.manualAddress}
              onChangeText={(text) =>
                setForm((prev) => ({
                  ...prev,
                  location: { ...prev.location, manualAddress: text },
                }))
              }
            />
            <TouchableOpacity
              style={styles.locationButton}
              onPress={getGeolocation}
              disabled={isGeolocating}
            >
              {isGeolocating ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="location" size={20} color="#FFFFFF" />
              )}
              <Text style={styles.locationButtonText}>
                {isGeolocating ? "Getting Location..." : "Use Current Location"}
              </Text>
            </TouchableOpacity>
            {form.location.lat && form.location.long && (
              <Text style={styles.coordinates}>
                📍 {form.location.lat.toFixed(6)},{" "}
                {form.location.long.toFixed(6)}
              </Text>
            )}
          </View>

          {/* Photo */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Photo (Optional)</Text>
            {form.photo ? (
              <View style={styles.photoContainer}>
                <Image source={{ uri: form.photo.uri }} style={styles.photo} />
                <TouchableOpacity
                  style={styles.removePhotoButton}
                  onPress={removePhoto}
                >
                  <Ionicons name="close-circle" size={24} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
                <Ionicons name="camera" size={24} color="#6B7280" />
                <Text style={styles.photoButtonText}>Add Photo</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              isSubmitting && styles.submitButtonDisabled,
            ]}
            onPress={submitIncident}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="send" size={20} color="#FFFFFF" />
            )}
            <Text style={styles.submitButtonText}>
              {isSubmitting ? "Submitting..." : "Report Incident"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

// styles object
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  scrollContent: {
    paddingBottom: 50,
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
  form: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#FFFFFF",
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#FFFFFF",
    minHeight: 100,
  },
  selectInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectText: {
    fontSize: 16,
    color: "#1F2937",
  },
  selectPlaceholder: {
    color: "#9CA3AF",
  },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  dropdownSheet: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
  },
  dropdownTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 8,
  },
  dropdownOption: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  dropdownOptionText: {
    fontSize: 16,
    color: "#374151",
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3B82F6",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  locationButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  coordinates: {
    fontSize: 14,
    color: "#10B981",
    marginTop: 8,
    textAlign: "center",
  },
  photoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#D1D5DB",
    borderStyle: "dashed",
    borderRadius: 8,
    padding: 20,
    backgroundColor: "#F9FAFB",
  },
  photoButtonText: {
    color: "#6B7280",
    fontSize: 16,
    marginLeft: 8,
  },
  photoContainer: {
    position: "relative",
  },
  photo: {
    width: "100%",
    height: 200,
    borderRadius: 8,
  },
  removePhotoButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DC2626",
    padding: 16,
    borderRadius: 8,
    marginTop: 10,
  },
  submitButtonDisabled: {
    backgroundColor: "#9CA3AF",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
  },
  recentIncidents: {
    padding: 20,
    paddingTop: 0,
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
  incidentDescription: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
  },
  incidentDate: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  noIncidents: {
    textAlign: "center",
    color: "#6B7280",
    fontSize: 16,
    marginVertical: 20,
  },
  // Missing styles for search component
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
  incidentLocation: {
    fontSize: 12,
    color: "#10B981",
    marginBottom: 4,
  },
});

export default CreateIncident;

// function CreateIncident() component

const getTypeLabel = (type: IncidentType | "") => {
  switch (type) {
    case IncidentType.SAFETY:
      return "Safety";
    case IncidentType.SECURITY:
      return "Security";
    case IncidentType.HR_VIOLATION:
      return "HR Violation";
    default:
      return "Select Type";
  }
};

const getSeverityLabel = (severity: IncidentSeverity | "") => {
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
      return "Select Severity";
  }
};
