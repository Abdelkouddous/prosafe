import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";
import { HapticTab } from "../components/HapticTab";
import { IconSymbol } from "../components/ui/IconSymbol";
import TabBarBackground from "../components/ui/TabBarBackground";
import { Colors } from "../constants/Colors";
import { useColorScheme } from "../hooks/useColorScheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: "absolute",
          },
          default: {},
        }),
      }}
    >
      {/* Incidences */}
      <Tabs.Screen
        name="incidents"
        options={{
          title: " Incidents",
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              size={28}
              name={
                focused
                  ? "exclamationmark.triangle.fill"
                  : "exclamationmark.triangle"
              }
              color={color}
            />
          ),
        }}
      />
      {/* Messages */}

      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              size={28}
              name={focused ? "message.fill" : "message"}
              color={color}
            />
          ),
        }}
      />
      {/* Menu */}
      <Tabs.Screen
        name="menu"
        options={{
          title: "Menu",
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              size={28}
              name={focused ? "list.bullet" : "list.bullet"}
              color={color}
            />
          ),
        }}
      />

      {/* formations */}
      <Tabs.Screen
        name="formations"
        options={{
          title: "Formations",
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              size={28}
              name={focused ? "book.fill" : "book"}
              color={color}
            />
          ),
        }}
      />
      {/* profile */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              size={28}
              name={focused ? "person.fill" : "person"}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
