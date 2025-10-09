import { Stack, Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";
import { HapticTab } from "../components/HapticTab";
import { IconSymbol } from "../components/ui/IconSymbol";
import TabBarBackground from "../components/ui/TabBarBackground";
import { Colors } from "../constants/Colors";
import { useColorScheme } from "../hooks/useColorScheme";

type TabIconProps = { color: string; focused: boolean };

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
      {/* training  */}
      <Tabs.Screen
        name="trainings"
        options={{
          title: "Trainings",
          tabBarIcon: ({ color, focused }: TabIconProps) => (
            <IconSymbol
              size={28}
              name={focused ? "book.fill" : "book"}
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
          tabBarIcon: ({ color, focused }: TabIconProps) => (
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
          tabBarIcon: ({ color, focused }: TabIconProps) => (
            <IconSymbol
              size={28}
              name={focused ? "list.bullet" : "list.bullet"}
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
          tabBarIcon: ({ color, focused }: TabIconProps) => (
            <IconSymbol
              size={28}
              name={focused ? "person.fill" : "person"}
              color={color}
            />
          ),
        }}
      />
      {/* get incidents */}
      <Tabs.Screen
        name="get-incidents"
        options={{
          title: "Recent Incidents",
          tabBarIcon: ({ color, focused }: TabIconProps) => (
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
      {/* Add Incident */}
      <Tabs.Screen
        name="incidents"
        options={{
          title: "Incident",
          tabBarIcon: ({ color, focused }: TabIconProps) => (
            <IconSymbol
              size={28}
              name={focused ? "plus" : "plus"}
              color={color}
            />
          ),
        }}
      />

      {/* Logout */}
      <Tabs.Screen
        name="logout"
        options={{
          title: "Logout",
          tabBarIcon: ({ color, focused }: TabIconProps) => (
            <IconSymbol
              size={28}
              name={focused ? "power.fill" : "power"}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
