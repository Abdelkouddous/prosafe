import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const handleManualPress = (section: string) => {
  // TODO: Navigate to specific manual section or open modal
  console.log(`Opening manual section: ${section}`);
};
export default function SafetyManualScreen() {
  return (
    <ScrollView>
      <View>
        {/* Manual Section */}
        <View style={styles.manualSection}>
          <Text style={styles.manualTitle}>
            Safety Manual / Manuel de Sécurité
          </Text>

          <TouchableOpacity
            style={styles.manualItem}
            onPress={() => handleManualPress("emergency")}
          >
            <Ionicons name="warning" size={24} color="#DC2626" />
            <View style={styles.manualItemContent}>
              <Text style={styles.manualItemTitle}>Emergency Procedures</Text>
              <Text style={styles.manualItemSubtitle}>
                Procédures d'urgence
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.manualItem}
            onPress={() => handleManualPress("safety")}
          >
            <Ionicons name="shield-checkmark" size={24} color="#10B981" />
            <View style={styles.manualItemContent}>
              <Text style={styles.manualItemTitle}>Safety Guidelines</Text>
              <Text style={styles.manualItemSubtitle}>
                Directives de sécurité
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.manualItem}
            onPress={() => handleManualPress("equipment")}
          >
            <Ionicons name="construct" size={24} color="#F59E0B" />
            <View style={styles.manualItemContent}>
              <Text style={styles.manualItemTitle}>Equipment Usage</Text>
              <Text style={styles.manualItemSubtitle}>
                Utilisation de l'équipement
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.manualItem}
            onPress={() => handleManualPress("protocols")}
          >
            <Ionicons name="document-text" size={24} color="#3B82F6" />
            <View style={styles.manualItemContent}>
              <Text style={styles.manualItemTitle}>Work Protocols</Text>
              <Text style={styles.manualItemSubtitle}>
                Protocoles de travail
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.manualItem}
            onPress={() => handleManualPress("contacts")}
          >
            <Ionicons name="call" size={24} color="#8B5CF6" />
            <View style={styles.manualItemContent}>
              <Text style={styles.manualItemTitle}>Emergency Contacts</Text>
              <Text style={styles.manualItemSubtitle}>Contacts d'urgence</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#007AFF",
    padding: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  content: {
    padding: 20,
  },
  section: {
    backgroundColor: "white",
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  value: {
    fontSize: 16,
    color: "#666",
  },
  manualSection: {
    marginTop: 20,
  },
  manualTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 16,
    textAlign: "center",
  },
  manualItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  manualItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  manualItemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  manualItemSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
  },
});
