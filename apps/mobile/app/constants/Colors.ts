/**
 * Color constants for Prosafe Safety Management System
 * Supports both light and dark themes with accessibility in mind
 */

export interface ColorScheme {
  // Primary brand colors
  primary: string;
  primaryLight: string;
  primaryDark: string;

  // Secondary colors
  secondary: string;
  secondaryLight: string;
  secondaryDark: string;

  // Background colors
  background: string;
  backgroundSecondary: string;
  backgroundTertiary: string;

  // Surface colors
  surface: string;
  surfaceSecondary: string;

  // Text colors
  text: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;

  // Interactive colors
  tint: string;
  tintSecondary: string;

  // Status colors
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  error: string;
  errorLight: string;
  info: string;
  infoLight: string;

  // Border and divider colors
  border: string;
  borderLight: string;
  divider: string;

  // Icon colors
  icon: string;
  iconSecondary: string;
  iconDisabled: string;

  // Input colors
  inputBackground: string;
  inputBorder: string;
  inputBorderFocused: string;
  inputPlaceholder: string;

  // Button colors
  buttonPrimary: string;
  buttonPrimaryText: string;
  buttonSecondary: string;
  buttonSecondaryText: string;
  buttonDisabled: string;
  buttonDisabledText: string;

  // Safety-specific colors
  safetyGreen: string;
  safetyYellow: string;
  safetyRed: string;
  safetyOrange: string;
  safetyBlue: string;

  // Card and container colors
  cardBackground: string;
  cardBorder: string;
  cardShadow: string;

  // Navigation colors
  tabBarBackground: string;
  tabBarBorder: string;
  tabBarActive: string;
  tabBarInactive: string;

  // Overlay colors
  overlay: string;
  modalBackground: string;
}

const lightColors: ColorScheme = {
  // Primary brand colors - Professional blue for safety industry
  primary: "#1E40AF", // Blue-700
  primaryLight: "#3B82F6", // Blue-500
  primaryDark: "#1E3A8A", // Blue-800

  // Secondary colors - Complementary orange for alerts/warnings
  secondary: "#EA580C", // Orange-600
  secondaryLight: "#FB923C", // Orange-400
  secondaryDark: "#C2410C", // Orange-700

  // Background colors
  background: "#FFFFFF",
  backgroundSecondary: "#F8FAFC", // Slate-50
  backgroundTertiary: "#F1F5F9", // Slate-100

  // Surface colors
  surface: "#FFFFFF",
  surfaceSecondary: "#F8FAFC", // Slate-50

  // Text colors
  text: "#0F172A", // Slate-900
  textSecondary: "#475569", // Slate-600
  textTertiary: "#64748B", // Slate-500
  textInverse: "#FFFFFF",

  // Interactive colors
  tint: "#1E40AF", // Primary blue
  tintSecondary: "#3B82F6", // Lighter blue

  // Status colors
  success: "#16A34A", // Green-600
  successLight: "#BBF7D0", // Green-200
  warning: "#D97706", // Amber-600
  warningLight: "#FEF3C7", // Amber-100
  error: "#DC2626", // Red-600
  errorLight: "#FECACA", // Red-200
  info: "#0284C7", // Sky-600
  infoLight: "#BAE6FD", // Sky-200

  // Border and divider colors
  border: "#E2E8F0", // Slate-200
  borderLight: "#F1F5F9", // Slate-100
  divider: "#E2E8F0", // Slate-200

  // Icon colors
  icon: "#64748B", // Slate-500
  iconSecondary: "#94A3B8", // Slate-400
  iconDisabled: "#CBD5E1", // Slate-300

  // Input colors
  inputBackground: "#FFFFFF",
  inputBorder: "#D1D5DB", // Gray-300
  inputBorderFocused: "#1E40AF", // Primary blue
  inputPlaceholder: "#9CA3AF", // Gray-400

  // Button colors
  buttonPrimary: "#1E40AF", // Primary blue
  buttonPrimaryText: "#FFFFFF",
  buttonSecondary: "#F1F5F9", // Slate-100
  buttonSecondaryText: "#1E40AF", // Primary blue
  buttonDisabled: "#E2E8F0", // Slate-200
  buttonDisabledText: "#94A3B8", // Slate-400

  // Safety-specific colors
  safetyGreen: "#16A34A", // Green-600 - Safe/Good
  safetyYellow: "#EAB308", // Yellow-500 - Caution
  safetyRed: "#DC2626", // Red-600 - Danger/Stop
  safetyOrange: "#EA580C", // Orange-600 - Warning
  safetyBlue: "#0284C7", // Sky-600 - Information

  // Card and container colors
  cardBackground: "#FFFFFF",
  cardBorder: "#E2E8F0", // Slate-200
  cardShadow: "rgba(0, 0, 0, 0.1)",

  // Navigation colors
  tabBarBackground: "#FFFFFF",
  tabBarBorder: "#E2E8F0", // Slate-200
  tabBarActive: "#1E40AF", // Primary blue
  tabBarInactive: "#94A3B8", // Slate-400

  // Overlay colors
  overlay: "rgba(0, 0, 0, 0.5)",
  modalBackground: "#FFFFFF",
};

const darkColors: ColorScheme = {
  // Primary brand colors - Adjusted for dark theme
  primary: "#3B82F6", // Blue-500
  primaryLight: "#60A5FA", // Blue-400
  primaryDark: "#1D4ED8", // Blue-600

  // Secondary colors
  secondary: "#FB923C", // Orange-400
  secondaryLight: "#FDBA74", // Orange-300
  secondaryDark: "#EA580C", // Orange-600

  // Background colors
  background: "#0F172A", // Slate-900
  backgroundSecondary: "#1E293B", // Slate-800
  backgroundTertiary: "#334155", // Slate-700

  // Surface colors
  surface: "#1E293B", // Slate-800
  surfaceSecondary: "#334155", // Slate-700

  // Text colors
  text: "#F8FAFC", // Slate-50
  textSecondary: "#CBD5E1", // Slate-300
  textTertiary: "#94A3B8", // Slate-400
  textInverse: "#0F172A", // Slate-900

  // Interactive colors
  tint: "#3B82F6", // Blue-500
  tintSecondary: "#60A5FA", // Blue-400

  // Status colors
  success: "#22C55E", // Green-500
  successLight: "#16A34A", // Green-600 (darker for dark theme)
  warning: "#F59E0B", // Amber-500
  warningLight: "#D97706", // Amber-600 (darker for dark theme)
  error: "#EF4444", // Red-500
  errorLight: "#DC2626", // Red-600 (darker for dark theme)
  info: "#0EA5E9", // Sky-500
  infoLight: "#0284C7", // Sky-600 (darker for dark theme)

  // Border and divider colors
  border: "#475569", // Slate-600
  borderLight: "#64748B", // Slate-500
  divider: "#475569", // Slate-600

  // Icon colors
  icon: "#94A3B8", // Slate-400
  iconSecondary: "#64748B", // Slate-500
  iconDisabled: "#475569", // Slate-600

  // Input colors
  inputBackground: "#1E293B", // Slate-800
  inputBorder: "#475569", // Slate-600
  inputBorderFocused: "#3B82F6", // Blue-500
  inputPlaceholder: "#64748B", // Slate-500

  // Button colors
  buttonPrimary: "#3B82F6", // Blue-500
  buttonPrimaryText: "#FFFFFF",
  buttonSecondary: "#334155", // Slate-700
  buttonSecondaryText: "#3B82F6", // Blue-500
  buttonDisabled: "#475569", // Slate-600
  buttonDisabledText: "#64748B", // Slate-500

  // Safety-specific colors
  safetyGreen: "#22C55E", // Green-500
  safetyYellow: "#EAB308", // Yellow-500
  safetyRed: "#EF4444", // Red-500
  safetyOrange: "#FB923C", // Orange-400
  safetyBlue: "#0EA5E9", // Sky-500

  // Card and container colors
  cardBackground: "#1E293B", // Slate-800
  cardBorder: "#475569", // Slate-600
  cardShadow: "rgba(0, 0, 0, 0.3)",

  // Navigation colors
  tabBarBackground: "#1E293B", // Slate-800
  tabBarBorder: "#475569", // Slate-600
  tabBarActive: "#3B82F6", // Blue-500
  tabBarInactive: "#64748B", // Slate-500

  // Overlay colors
  overlay: "rgba(0, 0, 0, 0.7)",
  modalBackground: "#1E293B", // Slate-800
};

export const Colors = {
  light: lightColors,
  dark: darkColors,
};

// Export individual color palettes for specific use cases
export const SafetyColors = {
  safe: "#16A34A", // Green-600
  caution: "#EAB308", // Yellow-500
  warning: "#EA580C", // Orange-600
  danger: "#DC2626", // Red-600
  info: "#0284C7", // Sky-600
};

export const BrandColors = {
  primary: "#1E40AF", // Blue-700
  secondary: "#EA580C", // Orange-600
  accent: "#7C3AED", // Violet-600
};

// Utility function to get colors based on theme
export const getColors = (
  colorScheme: "light" | "dark" | null | undefined
): ColorScheme => {
  return Colors[colorScheme ?? "light"];
};

// Utility function to get safety color based on status
export const getSafetyColor = (
  status: "safe" | "caution" | "warning" | "danger" | "info"
): string => {
  return SafetyColors[status];
};

// Common color combinations for consistent theming
export const ColorCombinations = {
  primary: {
    background: "#1E40AF",
    text: "#FFFFFF",
    border: "#1E3A8A",
  },
  success: {
    background: "#16A34A",
    text: "#FFFFFF",
    border: "#15803D",
  },
  warning: {
    background: "#D97706",
    text: "#FFFFFF",
    border: "#B45309",
  },
  error: {
    background: "#DC2626",
    text: "#FFFFFF",
    border: "#B91C1C",
  },
  info: {
    background: "#0284C7",
    text: "#FFFFFF",
    border: "#0369A1",
  },
};

export default Colors;
