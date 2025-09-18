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
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import api from "../services/api";
import { ScrollView, RefreshControl } from "react-native-gesture-handler";

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

const Incidences = () => {
  const [form, setForm] = useState<IncidentForm>({
    description: "",
    type: "",
    severity: "",
    date: Date.now().toString(),
    location: {
      lat: undefined,
      long: undefined,
      manualAddress: "",
    },
    photo: undefined,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [userIncidents, setUserIncidents] = useState<UserIncident[]>([]);
  const [isLoadingIncidents, setIsLoadingIncidents] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredIncidents, setFilteredIncidents] = useState<UserIncident[]>(
    []
  );

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserIncidents();
    setRefreshing(false);
  };

  useEffect(() => {
    requestPermissions();
    fetchUserIncidents();
  }, []);

  const requestPermissions = async () => {
    const { status: cameraStatus } =
      await ImagePicker.requestCameraPermissionsAsync();
    const { status: locationStatus } =
      await Location.requestForegroundPermissionsAsync();

    if (cameraStatus !== "granted" || locationStatus !== "granted") {
      Alert.alert(
        "Permissions Required",
        "Camera and location permissions are needed for full functionality."
      );
    }
  };

  // const fetchUserIncidents = async () => {
  //   try {
  //     setIsLoadingIncidents(true);
  //     const response = await api.get("/incidents");
  //     setUserIncidents(response.data);
  //   } catch (error) {
  //     console.error("Error fetching incidents:", error);
  //     Alert.alert("Error", "Failed to load your incidents");
  //   } finally {
  //     setIsLoadingIncidents(false);
  //   }
  // };
  const fetchUserIncidents = async () => {
    try {
      setIsLoadingIncidents(true);
      const response = await api.get("/incidents");

      // Ensure response data is in expected format
      if (Array.isArray(response.data)) {
        setUserIncidents(response.data);
        setFilteredIncidents(response.data); // Also update filtered incidents
      } else {
        throw new Error("Invalid data format received");
      }
    } catch (error) {
      console.error("Error fetching incidents:", error);
      Alert.alert("Error", "Failed to load your incidents");
    } finally {
      setIsLoadingIncidents(false);
    }
  };
  const getGeolocation = async () => {
    try {
      setIsGeolocating(true);
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      // Validate coordinates
      if (
        isNaN(location.coords.latitude) ||
        location.coords.latitude < -90 ||
        location.coords.latitude > 90 ||
        isNaN(location.coords.longitude) ||
        location.coords.longitude < -180 ||
        location.coords.longitude > 180
      ) {
        throw new Error("Invalid coordinates received");
      }

      setForm((prev) => ({
        ...prev,
        location: {
          ...prev.location,
          lat: location.coords.latitude,
          long: location.coords.longitude,
        },
      }));

      // Reverse geocoding
      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (address.length > 0) {
        const addrText = [
          address[0].street,
          address[0].city,
          address[0].region,
          address[0].country,
        ]
          .filter(Boolean)
          .join(", ");

        setForm((prev) => ({
          ...prev,
          location: {
            ...prev.location,
            manualAddress: addrText,
          },
        }));
      }
    } catch (error) {
      console.error("Location error:", error);
      Alert.alert("Error", "Could not get location");
    } finally {
      setIsGeolocating(false);
    }
  };

  // const pickImage = async () => {
  //   try {
  //     const result = await ImagePicker.launchImageLibraryAsync({
  //       mediaTypes: ImagePicker.MediaTypeOptions.Images,
  //       allowsEditing: true,
  //       aspect: [4, 3],
  //       quality: 0.8,
  //     });

  //     if (!result.canceled && result.assets[0]) {
  //       setForm((prev) => ({ ...prev, photo: result.assets[0] }));
  //     }
  //   } catch (error) {
  //     console.error("Image picker error:", error);
  //     Alert.alert("Error", "Failed to select image");
  //   }
  // };
  const pickImage = async () => {
    try {
      Alert.alert("Select Photo", "Choose how you want to add a photo", [
        {
          text: "Camera",
          onPress: async () => {
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [4, 3],
              quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
              setForm((prev) => ({ ...prev, photo: result.assets[0] }));
            }
          },
        },
        {
          text: "Gallery",
          onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [4, 3],
              quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
              setForm((prev) => ({ ...prev, photo: result.assets[0] }));
            }
          },
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]);
    } catch (error) {
      console.error("Image picker error:", error);
      Alert.alert("Error", "Failed to select image");
    }
  };
  const removePhoto = () => {
    setForm((prev) => ({ ...prev, photo: undefined }));
  };

  const validateForm = () => {
    if (!form.description || form.description.length < 10) {
      Alert.alert("Error", "Description must be at least 10 characters");
      return false;
    }
    if (!form.type) {
      Alert.alert("Error", "Please select an incident type");
      return false;
    }
    if (!form.severity) {
      Alert.alert("Error", "Please select incident severity");
      return false;
    }
    return true;
  };

  // const submitIncident = async () => {
  //   if (!validateForm()) return;

  //   try {
  //     setIsSubmitting(true);

  //     // Create FormData
  //     const formData = new FormData();

  //     // Append simple fields
  //     formData.append("description", form.description);
  //     formData.append("type", form.type);
  //     formData.append("severity", form.severity);
  //     formData.append("date", form.date?.toString() || "Invalid date");

  //     // Append location data properly
  //     if (form.location.lat !== undefined) {
  //       formData.append("location[lat]", String(form.location.lat));
  //     }
  //     if (form.location.long !== undefined) {
  //       formData.append("location[long]", String(form.location.long));
  //     }
  //     if (form.location.manualAddress) {
  //       formData.append("location[manualAddress]", form.location.manualAddress);
  //     }
  //     if (form.date) {
  //       formData.append("date", form.date);
  //     }

  //     if (form.location.lat !== undefined && form.location.long !== undefined) {
  //       formData.append("location[lat]", String(form.location.lat));
  //       formData.append("location[long]", String(form.location.long));
  //     }

  //     // Append photo if available (React Native specific format)
  //     if (form.photo) {
  //       const filename = form.photo.uri.split("/").pop();
  //       const match = /\.(\w+)$/.exec(filename || "");
  //       const type = match ? `image/${match[1]}` : "image/jpeg";

  //       formData.append("photo", {
  //         uri: form.photo.uri,
  //         name: filename || `photo_${Date.now()}.jpg`,
  //         type,
  //       } as any);
  //     }

  //     // Debug: Log the FormData contents
  //     console.log("FormData contents:");
  //     for (const [key, value] of formData.entries()) {
  //       console.log(key, value);
  //     }

  //     // Make the API call
  //     const response = await api.post("/incidents", formData, {
  //       headers: {
  //         "Content-Type": "multipart/form-data",
  //       },
  //       transformRequest: (data) => data, // Important for FormData in React Native
  //     });

  //     console.log("API Response:", response.data);

  //     if (response.data && response.data.id) {
  //       Alert.alert("Success", "Incident reported successfully!");
  //       // Reset form
  //       setForm({
  //         description: "",
  //         type: "",
  //         severity: "",
  //         location: {
  //           lat: undefined,
  //           long: undefined,
  //           manualAddress: "",
  //         },
  //         photo: undefined,
  //       });
  //       // Refresh incidents list
  //       fetchUserIncidents();
  //     } else {
  //       throw new Error("Invalid response from server");
  //     }
  //   } catch (error: any) {
  //     console.error("Submission error:", error);
  //     console.error("Error details:", error.response?.data);

  //     let errorMessage = "Failed to submit incident";
  //     if (error.response?.data?.errors) {
  //       errorMessage = Object.values(error.response.data.errors)
  //         .flat()
  //         .join("\n");
  //     } else if (error.response?.data?.message) {
  //       errorMessage = error.response.data.message;
  //     }

  //     Alert.alert("Error", errorMessage);
  //   } finally {
  //     setIsSubmitting(false);
  //   }
  // };
  const submitIncident = async () => {
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);

      const formData = new FormData();

      formData.append("description", form.description);
      formData.append("type", form.type);
      formData.append("severity", form.severity);
      formData.append("date", form.date?.toString() || "Invalid Date");
      // ... (your existing formData setup)
      // Add incident data
      // Add location fields individually instead of as JSON string
      // Validate coordinates before sending
      // Create FormData for multipart/form-data request

      if (form.location.lat !== undefined) {
        formData.append("location[lat]", form.location.lat.toString());
      }
      if (form.location.long !== undefined) {
        formData.append("location[long]", form.location.long.toString());
      }
      if (form.location.manualAddress) {
        formData.append("location[manualAddress]", form.location.manualAddress);
      }

      if (form.photo) {
        formData.append("photo", {
          uri: form.photo.uri,
          type: "image/jpeg",
          name: `incident-photo + ${Date.now().toString()} + .jpg`,
        } as any);
      }

      // Make the API call
      const response = await api.post("/incidents", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        transformRequest: (data) => data,
      });

      console.log("Full API Response:", response); // Log the entire response

      // More flexible response handling
      if (response.status >= 200 && response.status < 300) {
        Alert.alert("Success", "Incident reported successfully!");
        // Reset form
        setForm({
          description: "",
          type: "",
          severity: "",
          location: {
            lat: undefined,
            long: undefined,
            manualAddress: "",
          },
          photo: undefined,
          date: Date.now().toString() || "",
        });
        // Force refresh incidents list
        await fetchUserIncidents();
      } else {
        throw new Error(
          response.data?.message || "Invalid response from server"
        );
      }
    } catch (error: any) {
      console.error("Full error object:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message ||
          error.message ||
          "Failed to submit incident"
      );
    } finally {
      setIsSubmitting(false);
    }
  };
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

  // Filter incidents based on search query
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
          (incident.manualAddress &&
            incident.manualAddress
              .toLowerCase()
              .includes(searchQuery.toLowerCase()))
      );
      setFilteredIncidents(filtered);
    }
  }, [searchQuery, userIncidents]);

  return (
    // Update your ScrollView component:
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#DC2626"]} // Customize as needed
        />
      }
    >
      {/* Search Component */}
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
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.header}>
        <Ionicons name="warning" size={24} color="#DC2626" />
        <Text style={styles.headerTitle}>Incident Declaration</Text>
      </View>

      <View style={styles.form}>
        {/* Description */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Detailed Description *</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Describe in detail what happened..."
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
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={form.type}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, type: value }))
              }
              style={styles.picker}
            >
              <Picker.Item label="Select Type" value="" />
              <Picker.Item label="Safety" value={IncidentType.SAFETY} />
              <Picker.Item label="Security" value={IncidentType.SECURITY} />
              <Picker.Item
                label="HR Violation"
                value={IncidentType.HR_VIOLATION}
              />
            </Picker>
          </View>
        </View>

        {/* Severity */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Severity *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={form.severity}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, severity: value }))
              }
              style={styles.picker}
            >
              <Picker.Item label="Select Severity" value="" />
              <Picker.Item label="Low" value={IncidentSeverity.LOW} />
              <Picker.Item label="Medium" value={IncidentSeverity.MEDIUM} />
              <Picker.Item label="High" value={IncidentSeverity.HIGH} />
              <Picker.Item label="Critical" value={IncidentSeverity.CRITICAL} />
            </Picker>
          </View>
        </View>

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
              📍 {form.location.lat.toFixed(6)}, {form.location.long.toFixed(6)}
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

      {/* Recent Incidents */}
      <View style={styles.recentIncidents}>
        <Text style={styles.sectionTitle}>
          {searchQuery
            ? `Search Results (${filteredIncidents.length})`
            : "My Recent Incidents"}
        </Text>
        {isLoadingIncidents ? (
          <ActivityIndicator
            size="large"
            color="#DC2626"
            style={styles.loader}
          />
        ) : filteredIncidents.length > 0 ? (
          filteredIncidents.map((incident) => (
            <View key={incident.id} style={styles.incidentCard}>
              <View style={styles.incidentHeader}>
                <Text style={styles.incidentType}>
                  {getTypeLabel(incident.type)}
                </Text>
                <View
                  style={[
                    styles.severityBadge,
                    { backgroundColor: getSeverityColor(incident.severity) },
                  ]}
                >
                  <Text style={styles.severityText}>
                    {getSeverityLabel(incident.severity)}
                  </Text>
                </View>
              </View>
              <Text style={styles.incidentDescription} numberOfLines={2}>
                {incident.description}
              </Text>
              {incident.manualAddress && (
                <Text style={styles.locationButton} numberOfLines={1}>
                  📍 {incident.manualAddress}
                </Text>
              )}
              <Text style={styles.incidentDate}>
                {new Date(incident.createdAt).toLocaleDateString()}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.noIncidents}>
            {searchQuery
              ? "No incidents found matching your search"
              : "No incidents reported yet"}
          </Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
    marginLeft: 10,
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
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
  },
  picker: {
    height: 50,
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

export default Incidences;
