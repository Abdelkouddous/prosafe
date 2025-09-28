import { StyleSheet } from "react-native";

export const createAuthStyles = (colors: any) =>
  StyleSheet.create({
    // Container styles
    container: {
      flex: 1,
      backgroundColor: colors.background, 
    },
    scrollContainer: {
      flexGrow: 1,
      justifyContent: "center",
      padding: 20,
    },

    // Logo and branding
    logoContainer: {
      alignItems: "center",
      marginBottom: 40,
    },
    logo: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.tint,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
    },
    title: {
      fontSize: 28,
      fontWeight: "bold",
      color: colors.text,
      textAlign: "center",
    },
    subtitle: {
      fontSize: 16,
      color: colors.icon,
      textAlign: "center",
      marginTop: 8,
    },

    // Form styles
    formContainer: {
      marginBottom: 30,
    },
    inputRow: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    inputContainer: {
      marginBottom: 16,
    },
    inputContainerHalf: {
      flex: 0.48,
      marginBottom: 16,
    },
    label: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.icon,
      borderRadius: 8,
      padding: 16,
      fontSize: 16,
      color: colors.text,
      backgroundColor: colors.background,
    },
    inputFocused: {
      borderColor: colors.tint,
      borderWidth: 2,
    },

    // Button styles
    primaryButton: {
      backgroundColor: colors.tint,
      borderRadius: 8,
      padding: 16,
      alignItems: "center",
      marginTop: 8,
    },
    primaryButtonDisabled: {
      backgroundColor: colors.icon,
    },
    primaryButtonText: {
      color: "white",
      fontSize: 16,
      fontWeight: "600",
    },

    // Loading states
    loadingContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    loadingText: {
      color: "white",
      fontSize: 16,
      fontWeight: "600",
      marginLeft: 8,
    },

    // Navigation links
    linkContainer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginTop: 30,
      paddingVertical: 20,
    },
    linkText: {
      fontSize: 16,
      color: colors.icon,
      marginRight: 8,
    },
    linkButton: {
      fontSize: 16,
      color: colors.tint,
      fontWeight: "600",
    },

    // Test accounts (specific to login)
    testAccountsContainer: {
      marginTop: 30,
      padding: 20,
      backgroundColor: colors.background,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.icon,
    },
    testAccountsTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 15,
      textAlign: "center",
    },
    testAccountButton: {
      backgroundColor: "#f8f9fa",
      borderRadius: 8,
      padding: 12,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: "#e9ecef",
    },
    testAccountInfo: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    testAccountEmail: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
    },
    testAccountRole: {
      fontSize: 12,
      color: colors.icon,
      backgroundColor: colors.tint,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
      overflow: "hidden",
    },
    testAccountPassword: {
      fontSize: 12,
      color: colors.icon,
      marginTop: 4,
    },
  });

export const createRTLStyles = (isRTL: boolean) =>
  StyleSheet.create({
    // RTL-specific styles
    container: {
      direction: isRTL ? "rtl" : "ltr",
    },
    inputRow: {
      flexDirection: isRTL ? "row-reverse" : "row",
    },
    linkContainer: {
      flexDirection: isRTL ? "row-reverse" : "row",
    },
    loadingContainer: {
      flexDirection: isRTL ? "row-reverse" : "row",
    },
    testAccountInfo: {
      flexDirection: isRTL ? "row-reverse" : "row",
    },
    linkText: {
      marginRight: isRTL ? 0 : 8,
      marginLeft: isRTL ? 8 : 0,
    },
    loadingText: {
      marginLeft: isRTL ? 0 : 8,
      marginRight: isRTL ? 8 : 0,
    },
    input: {
      textAlign: isRTL ? "right" : "left",
      writingDirection: isRTL ? "rtl" : "ltr",
    },
    title: {
      textAlign: "center",
      writingDirection: isRTL ? "rtl" : "ltr",
    },
    subtitle: {
      textAlign: "center",
      writingDirection: isRTL ? "rtl" : "ltr",
    },
    label: {
      textAlign: isRTL ? "right" : "left",
      writingDirection: isRTL ? "rtl" : "ltr",
    },
  });

// Helper function to merge styles
export const mergeStyles = (
  baseStyles: any,
  rtlStyles: any,
  isRTL: boolean
) => {
  if (!isRTL) return baseStyles;

  const merged: any = {};
  Object.keys(baseStyles).forEach((key) => {
    merged[key] = rtlStyles[key]
      ? { ...baseStyles[key], ...rtlStyles[key] }
      : baseStyles[key];
  });

  return merged;
};
