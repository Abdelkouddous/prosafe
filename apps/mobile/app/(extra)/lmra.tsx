import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

interface RiskLevel {
  level: "low" | "medium" | "high" | "critical";
  color: string;
  description: string;
}

interface Hazard {
  id: string;
  category: string;
  description: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  mitigation: string;
  selected: boolean;
}

interface LMRAForm {
  taskDescription: string;
  location: string;
  personnel: string;
  equipment: string;
  identifiedHazards: Hazard[];
  additionalMeasures: string;
  supervisorApproval: boolean;
}

const LMRA = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState<LMRAForm>({
    taskDescription: "",
    location: "",
    personnel: "",
    equipment: "",
    identifiedHazards: [],
    additionalMeasures: "",
    supervisorApproval: false,
  });

  const riskLevels: Record<string, RiskLevel> = {
    low: { level: "low", color: "#10B981", description: "Low Risk" },
    medium: { level: "medium", color: "#F59E0B", description: "Medium Risk" },
    high: { level: "high", color: "#EF4444", description: "High Risk" },
    critical: { level: "critical", color: "#7C2D12", description: "Critical Risk" },
  };

  const commonHazards: Hazard[] = [
    {
      id: "slip",
      category: "Physical",
      description: "Slips, trips, and falls",
      riskLevel: "medium",
      mitigation: "Ensure walkways are clear, use non-slip footwear, install barriers",
      selected: false,
    },
    {
      id: "electrical",
      category: "Electrical",
      description: "Electrical shock/electrocution",
      riskLevel: "high",
      mitigation: "Use LOTO procedures, test equipment, wear appropriate PPE",
      selected: false,
    },
    {
      id: "chemical",
      category: "Chemical",
      description: "Chemical exposure",
      riskLevel: "high",
      mitigation: "Use proper ventilation, wear chemical-resistant PPE, follow SDS",
      selected: false,
    },
    {
      id: "machinery",
      category: "Mechanical",
      description: "Moving machinery/equipment",
      riskLevel: "high",
      mitigation: "Install guards, use LOTO, maintain safe distances",
      selected: false,
    },
    {
      id: "height",
      category: "Physical",
      description: "Working at height",
      riskLevel: "critical",
      mitigation: "Use fall protection, inspect equipment, secure work area",
      selected: false,
    },
    {
      id: "lifting",
      category: "Ergonomic",
      description: "Manual handling/lifting",
      riskLevel: "medium",
      mitigation: "Use proper lifting techniques, mechanical aids, team lifting",
      selected: false,
    },
    {
      id: "noise",
      category: "Physical",
      description: "Excessive noise exposure",
      riskLevel: "medium",
      mitigation: "Use hearing protection, limit exposure time, reduce noise at source",
      selected: false,
    },
    {
      id: "confined",
      category: "Environmental",
      description: "Confined space entry",
      riskLevel: "critical",
      mitigation: "Obtain permits, test atmosphere, use ventilation, standby person",
      selected: false,
    },
  ];

  const [hazards, setHazards] = useState<Hazard[]>(commonHazards);

  const toggleHazard = (hazardId: string) => {
    setHazards(prev =>
      prev.map(hazard =>
        hazard.id === hazardId
          ? { ...hazard, selected: !hazard.selected }
          : hazard
      )
    );
  };

  const getSelectedHazards = () => {
    return hazards.filter(hazard => hazard.selected);
  };

  const getOverallRiskLevel = () => {
    const selectedHazards = getSelectedHazards();
    if (selectedHazards.length === 0) return "low";
    
    const riskLevels = selectedHazards.map(h => h.riskLevel);
    if (riskLevels.includes("critical")) return "critical";
    if (riskLevels.includes("high")) return "high";
    if (riskLevels.includes("medium")) return "medium";
    return "low";
  };

  const submitLMRA = () => {
    const selectedHazards = getSelectedHazards();
    if (!form.taskDescription || !form.location || selectedHazards.length === 0) {
      Alert.alert("Incomplete Form", "Please fill in all required fields and select at least one hazard.");
      return;
    }

    Alert.alert(
      "LMRA Submitted",
      "Your Last Minute Risk Assessment has been submitted successfully.",
      [
        {
          text: "New Assessment",
          onPress: () => {
            setForm({
              taskDescription: "",
              location: "",
              personnel: "",
              equipment: "",
              identifiedHazards: [],
              additionalMeasures: "",
              supervisorApproval: false,
            });
            setHazards(commonHazards);
            setCurrentStep(1);
          }
        },
        {
          text: "Done",
          onPress: () => router.back()
        }
      ]
    );
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Task Information</Text>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Task Description *</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Describe the task to be performed..."
          value={form.taskDescription}
          onChangeText={(text) => setForm(prev => ({ ...prev, taskDescription: text }))}
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Location *</Text>
        <TextInput
          style={styles.input}
          placeholder="Work location/area"
          value={form.location}
          onChangeText={(text) => setForm(prev => ({ ...prev, location: text }))}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Personnel Involved</Text>
        <TextInput
          style={styles.input}
          placeholder="Names of personnel"
          value={form.personnel}
          onChangeText={(text) => setForm(prev => ({ ...prev, personnel: text }))}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Equipment/Tools</Text>
        <TextInput
          style={styles.textArea}
          placeholder="List equipment and tools to be used..."
          value={form.equipment}
          onChangeText={(text) => setForm(prev => ({ ...prev, equipment: text }))}
          multiline
          numberOfLines={2}
        />
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Hazard Identification</Text>
      <Text style={styles.stepSubtitle}>Select all hazards that apply to this task:</Text>
      
      <View style={styles.hazardsList}>
        {hazards.map((hazard) => (
          <TouchableOpacity
            key={hazard.id}
            style={[
              styles.hazardCard,
              hazard.selected && styles.hazardCardSelected
            ]}
            onPress={() => toggleHazard(hazard.id)}
          >
            <View style={styles.hazardHeader}>
              <View style={styles.hazardInfo}>
                <Text style={styles.hazardCategory}>{hazard.category}</Text>
                <View style={[
                  styles.riskBadge,
                  { backgroundColor: riskLevels[hazard.riskLevel].color }
                ]}>
                  <Text style={styles.riskBadgeText}>
                    {riskLevels[hazard.riskLevel].description}
                  </Text>
                </View>
              </View>
              <Ionicons
                name={hazard.selected ? "checkbox" : "square-outline"}
                size={24}
                color={hazard.selected ? "#3B82F6" : "#9CA3AF"}
              />
            </View>
            <Text style={styles.hazardDescription}>{hazard.description}</Text>
            <Text style={styles.hazardMitigation}>
              <Text style={styles.mitigationLabel}>Mitigation: </Text>
              {hazard.mitigation}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Risk Assessment Summary</Text>
      
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryTitle}>Overall Risk Level</Text>
          <View style={[
            styles.overallRiskBadge,
            { backgroundColor: riskLevels[getOverallRiskLevel()].color }
          ]}>
            <Text style={styles.overallRiskText}>
              {riskLevels[getOverallRiskLevel()].description.toUpperCase()}
            </Text>
          </View>
        </View>
        
        <Text style={styles.summarySubtitle}>Selected Hazards ({getSelectedHazards().length})</Text>
        {getSelectedHazards().map((hazard) => (
          <View key={hazard.id} style={styles.selectedHazard}>
            <Text style={styles.selectedHazardText}>{hazard.description}</Text>
            <View style={[
              styles.miniRiskBadge,
              { backgroundColor: riskLevels[hazard.riskLevel].color }
            ]}>
              <Text style={styles.miniRiskText}>{hazard.riskLevel.toUpperCase()}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Additional Control Measures</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Any additional safety measures or precautions..."
          value={form.additionalMeasures}
          onChangeText={(text) => setForm(prev => ({ ...prev, additionalMeasures: text }))}
          multiline
          numberOfLines={3}
        />
      </View>

      <TouchableOpacity
        style={styles.approvalButton}
        onPress={() => setForm(prev => ({ ...prev, supervisorApproval: !prev.supervisorApproval }))}
      >
        <Ionicons
          name={form.supervisorApproval ? "checkbox" : "square-outline"}
          size={24}
          color={form.supervisorApproval ? "#3B82F6" : "#9CA3AF"}
        />
        <Text style={styles.approvalText}>
          I confirm that all risks have been assessed and appropriate control measures are in place
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>LMRA</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressSteps}>
          {[1, 2, 3].map((step) => (
            <View key={step} style={styles.progressStep}>
              <View style={[
                styles.progressCircle,
                currentStep >= step && styles.progressCircleActive
              ]}>
                <Text style={[
                  styles.progressNumber,
                  currentStep >= step && styles.progressNumberActive
                ]}>
                  {step}
                </Text>
              </View>
              <Text style={styles.progressLabel}>
                {step === 1 ? "Task Info" : step === 2 ? "Hazards" : "Summary"}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <ScrollView style={styles.content}>
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
        {currentStep > 1 && (
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => setCurrentStep(currentStep - 1)}
          >
            <Ionicons name="chevron-back" size={20} color="#3B82F6" />
            <Text style={styles.navButtonText}>Previous</Text>
          </TouchableOpacity>
        )}
        
        <View style={styles.navSpacer} />
        
        {currentStep < 3 ? (
          <TouchableOpacity
            style={styles.navButtonPrimary}
            onPress={() => setCurrentStep(currentStep + 1)}
          >
            <Text style={styles.navButtonPrimaryText}>Next</Text>
            <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!form.supervisorApproval || getSelectedHazards().length === 0) && styles.submitButtonDisabled
            ]}
            onPress={submitLMRA}
            disabled={!form.supervisorApproval || getSelectedHazards().length === 0}
          >
            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
            <Text style={styles.submitButtonText}>Submit LMRA</Text>
          </TouchableOpacity>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
  },
  placeholder: {
    width: 40,
  },
  progressContainer: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  progressSteps: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  progressStep: {
    alignItems: "center",
    marginHorizontal: 30,
  },
  progressCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  progressCircleActive: {
    backgroundColor: "#3B82F6",
  },
  progressNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#9CA3AF",
  },
  progressNumberActive: {
    color: "#FFFFFF",
  },
  progressLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  stepContainer: {
    paddingBottom: 20,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 20,
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
    minHeight: 80,
    textAlignVertical: "top",
  },
  hazardsList: {
    gap: 12,
  },
  hazardCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 16,
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  hazardCardSelected: {
    borderColor: "#3B82F6",
    backgroundColor: "#F0F9FF",
  },
  hazardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  hazardInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  hazardCategory: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    marginRight: 12,
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  riskBadgeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  hazardDescription: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 8,
  },
  hazardMitigation: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  mitigationLabel: {
    fontWeight: "600",
    color: "#374151",
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
  },
  overallRiskBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  overallRiskText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  summarySubtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  selectedHazard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  selectedHazardText: {
    fontSize: 14,
    color: "#374151",
    flex: 1,
  },
  miniRiskBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  miniRiskText: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  approvalButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  approvalText: {
    fontSize: 14,
    color: "#374151",
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  navigationContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#3B82F6",
  },
  navButtonText: {
    fontSize: 16,
    color: "#3B82F6",
    fontWeight: "600",
    marginLeft: 4,
  },
  navSpacer: {
    flex: 1,
  },
  navButtonPrimary: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3B82F6",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  navButtonPrimaryText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "600",
    marginRight: 4,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10B981",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  submitButtonDisabled: {
    backgroundColor: "#9CA3AF",
  },
  submitButtonText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "600",
    marginLeft: 4,
  },
});

export default LMRA;