import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../contexts/AuthContext";
import { router } from "expo-router";

const { width } = Dimensions.get("window");
const cardWidth = (width - 60) / 3; // 3 cards per row with margins

interface MenuOption {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
}

export default function MenuScreen() {
  const { user, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const menuOptions: MenuOption[] = [
    {
      id: "report-situation",
      title: "Report Situation",
      icon: "phone-portrait",
      color: "#4A90E2",
      onPress: () => handleMenuPress("report-situation"),
    },
    {
      id: "reports",
      title: "Reports",
      icon: "notifications",
      color: "#4A90E2",
      onPress: () => handleMenuPress("reports"),
    },
    // {
    //   id: "work-alone",
    //   title: "Work alone",
    //   icon: "time",
    //   color: "#4A90E2",
    //   onPress: () => handleMenuPress("work-alone"),
    // },
    {
      id: "information",
      title: "Information",
      icon: "information-circle",
      color: "#4A90E2",
      onPress: () => handleMenuPress("information"),
    },
    // {
    //   id: "toolboxes",
    //   title: "Toolboxes",
    //   icon: "build",
    //   color: "#4A90E2",
    //   onPress: () => handleMenuPress("toolboxes"),
    // },
    {
      id: "flashcards",
      title: "Flashcards",
      icon: "card",
      color: "#4A90E2",
      onPress: () => handleMenuPress("flashcards"),
    },
    // {
    //   id: "inspections",
    //   title: "Inspections",
    //   icon: "eye",
    //   color: "#4A90E2",
    //   onPress: () => handleMenuPress("inspections"),
    // },
    {
      id: "lmra",
      title: "LMRA",
      icon: "ellipse",
      color: "#4A90E2",
      onPress: () => handleMenuPress("lmra"),
    },
    {
      id: "news",
      title: "News",
      icon: "newspaper",
      color: "#4A90E2",
      onPress: () => handleMenuPress("news"),
    },
    {
      id: "safety-manual",
      title: "Safety Manual",
      icon: "book",
      color: "#4A90E2",
      onPress: () => handleMenuPress("safety-manual"),
    },
    {
      id: "check-stock",
      title: "Stock",
      icon: "bag-add-sharp",
      color: "#4A90E2",
      onPress: () => handleMenuPress("check-stock"),
    },
  ];

  const handleMenuPress = (optionId: string) => {
    // TODO: Implement navigation to specific screens
    switch (optionId) {
      case "report-situation":
        // Alert.alert("Report Situation", "Navigate to incident reporting");
        router.push("/(tabs)/incidents");
        //
        break;
      case "reports":
        Alert.alert("Reports", "Navigate to reports dashboard");
        break;
      // case "work-alone":
      //   Alert.alert("Work Alone", "Navigate to lone worker monitoring");
      //   break;
      case "information":
        Alert.alert("Information", "Navigate to information center");
        break;
      // case "toolboxes":
      //   Alert.alert("Toolboxes", "Navigate to toolbox talks");
      //   break;
      // case "flashcards":
      //   Alert.alert("Flashcards", "Navigate to safety flashcards");
      //   break;
      // case "inspections":
      //   Alert.alert("Inspections", "Navigate to safety inspections");
      //   break;
      case "lmra":
        Alert.alert("LMRA", "Navigate to Last Minute Risk Assessment");
        break;
      case "news":
        Alert.alert("News", "Navigate to company news");
        break;
      case "safety-manual":
        // Alert.alert("Safety Manual", "Navigate to safety manual");
        router.push("../(extra)/safetymanual");
        break;
      case "bag-add-sharp":
        Alert.alert("Stock", "Stock nav");
      default:
        Alert.alert("Coming Soon", "This feature will be available soon!");
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // TODO: Refresh dashboard data
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
            // Navigation will be handled by RouteGuard
          } catch (error) {
            console.error("Logout error:", error);
            Alert.alert("Error", "Failed to logout. Please try again.");
          }
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header with Logo */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>PROSAFE</Text>
            <Text style={styles.logoSubtext}>SAVE YOUR WORK</Text>
          </View>
          <TouchableOpacity style={styles.searchButton}>
            <Ionicons name="search" size={24} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Menu Grid */}
      <View style={styles.menuContainer}>
        <View style={styles.menuGrid}>
          {menuOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.menuCard}
              onPress={option.onPress}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.menuIconCircle,
                  { backgroundColor: option.color },
                ]}
              >
                <Ionicons name={option.icon} size={32} color="#FFFFFF" />
              </View>
              <Text style={styles.menuTitle}>{option.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Logout Button */}
      <View style={styles.logoutContainer}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out" size={20} color="#FFFFFF" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

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
    justifyContent: "space-around",
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    margin: "auto",
  },
  menuButton: {
    padding: 8,
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
  searchButton: {
    left: 90,
  },
  topNavContainer: {
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    paddingVertical: 15,
    paddingHorizontal: 20,
    justifyContent: "space-around",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  topNavItem: {
    alignItems: "center",
    flex: 1,
  },
  topNavIconContainer: {
    position: "relative",
    marginBottom: 5,
  },
  topNavBadge: {
    position: "absolute",
    top: -8,
    right: -8,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  topNavBadgeText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  topNavTitle: {
    fontSize: 12,
    color: "#374151",
    textAlign: "center",
  },
  menuContainer: {
    padding: 20,
  },
  menuGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-evenly",
  },
  menuCard: {
    width: cardWidth,
    alignItems: "center",
    marginBottom: 20,
  },
  menuIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuTitle: {
    fontSize: 12,
    fontWeight: "500",
    color: "#1F2937",
    textAlign: "center",
    lineHeight: 16,
  },
  logoutContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  logoutButton: {
    backgroundColor: "#DC2626",
    borderRadius: 8,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: 8,
  },
});
