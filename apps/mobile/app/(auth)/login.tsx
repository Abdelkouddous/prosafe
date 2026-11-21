import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import {
  createAuthStyles,
  createRTLStyles,
  mergeStyles,
} from "@/styles/AuthStyles";
import Shield from "@expo/vector-icons/MaterialIcons";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { t, isRTL } = useLanguage();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const styles = createAuthStyles(colors);
  const rtlStyles = createRTLStyles(isRTL);

  // handle login functionality
  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(t("error"), t("fillAllFields"));
      return;
    }

    setIsLoading(true);
    try {
      await login(email.trim(), password);
      // Remove the manual redirect - RouteGuard will handle it based on user role
    } catch (error: any) {
      // Check if the error is for pending account approval
      if (error?.message === "ACCOUNT_PENDING_APPROVAL") {
        Alert.alert(t("error"), t("accountPendingApproval"));
        return;
      }

      // Check if the error is for blocked account
      if (error?.message === "ACCOUNT_BLOCKED") {
        Alert.alert(t("error"), t("accountBlocked"));
        return;
      }

      console.error("Error:", error?.message);

      const errorMessage = error?.response?.data?.message || t("loginFailed");
      Alert.alert(t("loginFailed"), errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const mergedStyles = mergeStyles(styles, rtlStyles, isRTL);

  return (
    <KeyboardAvoidingView
      style={mergedStyles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={mergedStyles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={mergedStyles.logoContainer}>
          <View style={mergedStyles.logo}>
            <Shield name="shield" size={40} color="white" />
          </View>
          <Text style={mergedStyles.title}>{t("prosafe")}</Text>
          <Text style={mergedStyles.subtitle}>
            {t("safetyManagementSystem")}
          </Text>
        </View>

        <View style={mergedStyles.formContainer}>
          <View style={mergedStyles.inputContainer}>
            <Text style={mergedStyles.label}>{t("email")}</Text>
            <TextInput
              style={mergedStyles.input}
              value={email}
              onChangeText={setEmail}
              placeholder={t("enterEmail")}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={mergedStyles.inputContainer}>
            <Text style={mergedStyles.label}>{t("password")}</Text>
            <TextInput
              style={mergedStyles.input}
              value={password}
              onChangeText={setPassword}
              placeholder={t("enterPassword")}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <TouchableOpacity
            style={[
              mergedStyles.primaryButton,
              isLoading && mergedStyles.primaryButtonDisabled,
            ]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <View style={mergedStyles.loadingContainer}>
                <ActivityIndicator size="small" color="white" />
                <Text style={mergedStyles.loadingText}>{t("signingIn")}</Text>
              </View>
            ) : (
              <Text style={mergedStyles.primaryButtonText}>{t("signIn")}</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={mergedStyles.linkContainer}>
          <Text style={mergedStyles.linkText}>{t("newToProsafe")}</Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
            <Text style={mergedStyles.linkButton}>{t("createAccount")}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
