import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  color?: string;
}

export function Chip({ label, selected, onPress, color = "#2563EB" }: ChipProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      style={[
        styles.chip,
        selected && { backgroundColor: color, borderColor: color },
      ]}
    >
      <Text style={[styles.text, selected && styles.textSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#FFFFFF",
    marginRight: 8,
    marginBottom: 8,
  },
  text: { fontSize: 14, color: "#374151", fontWeight: "500" },
  textSelected: { color: "#FFFFFF" },
});
