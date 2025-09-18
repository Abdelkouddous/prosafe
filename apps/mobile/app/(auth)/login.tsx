import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  ToastAndroid,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../contexts/AuthContext";
import { Colors } from "../constants/Colors";
import { useColorScheme } from "../hooks/useColorScheme";
import Shield from "@expo/vector-icons/MaterialIcons";
import { API_BASE_URL } from "../services/api";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showTestAccounts, setShowTestAccounts] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  // Test backend connection on component mount
  useEffect(() => {
    console.log("API_BASE_URL:", API_BASE_URL);
    console.log("Platform:", Platform.OS);

    const testBackendConnection = async () => {
      try {
        if (!API_BASE_URL) {
          console.log("No API_BASE_URL configured, using test accounts only");
          setShowTestAccounts(true);
          return;
        }

        const url = `${API_BASE_URL}/health-check`;
        console.log("Attempting to connect to:", url);

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Login: Backend connection successful!", data);

        // Show success toast
        if (Platform.OS === "android") {
          ToastAndroid.show(
            "Backend connected successfully!",
            ToastAndroid.SHORT
          );
        } else {
          Alert.alert("Success", "Backend connected successfully!");
        }
      } catch (error) {
        console.error("Login: Failed to connect to backend:", error);
        setShowTestAccounts(true);

        // Show error toast
        if (Platform.OS === "android") {
          ToastAndroid.show(
            "Using test accounts (backend offline)",
            ToastAndroid.LONG
          );
        } else {
          Alert.alert("Info", "Using test accounts (backend offline)");
        }
      }
    };

    testBackendConnection();
  }, []);
  // handle login functionality
  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      await login(email.trim(), password);
      // Remove the manual redirect - RouteGuard will handle it based on user role
    } catch (error: any) {
      console.error("Login failed:", error);
      const errorMessage =
        error?.response?.data?.message || "Login failed. Please try again.";
      Alert.alert("Login Failed", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const fillTestAccount = (testEmail: string, testPassword: string) => {
    setEmail(testEmail);
    setPassword(testPassword);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContainer: {
      flexGrow: 1,
      justifyContent: "center",
      padding: 20,
    },
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
    formContainer: {
      marginBottom: 30,
    },
    inputContainer: {
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
    loginButton: {
      backgroundColor: colors.tint,
      borderRadius: 8,
      padding: 16,
      alignItems: "center",
      marginTop: 8,
    },
    loginButtonDisabled: {
      backgroundColor: colors.icon,
    },
    loginButtonText: {
      color: "white",
      fontSize: 16,
      fontWeight: "600",
    },
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
      // color: "white",
      overflow: "hidden",
    },
    testAccountPassword: {
      fontSize: 12,
      color: colors.icon,
      marginTop: 4,
    },
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Shield name="shield" size={40} color="white" />
          </View>
          <Text style={styles.title}>Prosafe</Text>
          <Text style={styles.subtitle}>Safety Management System</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.loginButton,
              isLoading && styles.loginButtonDisabled,
            ]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="white" />
                <Text style={styles.loadingText}>Signing in...</Text>
              </View>
            ) : (
              <Text style={styles.loginButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        {showTestAccounts && (
          <View style={styles.testAccountsContainer}>
            <Text style={styles.testAccountsTitle}>🧪 Test Accounts</Text>

            <TouchableOpacity
              style={styles.testAccountButton}
              onPress={() => fillTestAccount("test@prosafe.com", "test123")}
            >
              <View style={styles.testAccountInfo}>
                <Text style={styles.testAccountEmail}>test@prosafe.com</Text>
                <Text style={styles.testAccountRole}>USER</Text>
              </View>
              <Text style={styles.testAccountPassword}>Password: test123</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.testAccountButton}
              onPress={() => fillTestAccount("admin@prosafe.com", "admin123")}
            >
              <View style={styles.testAccountInfo}>
                <Text style={styles.testAccountEmail}>admin@prosafe.com</Text>
                <Text style={styles.testAccountRole}>ADMIN</Text>
              </View>
              <Text style={styles.testAccountPassword}>Password: admin123</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
