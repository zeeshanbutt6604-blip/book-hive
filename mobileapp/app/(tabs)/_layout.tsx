import React from "react";
import { Tabs } from "expo-router";
import { StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import DarkTheme from "@/styles/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: DarkTheme.colors.primary,
        tabBarStyle: styles.tabBarStyle,
        tabBarShowLabel: true,
        tabBarLabelStyle: { color: "white", fontSize: 13 },
        tabBarInactiveTintColor: DarkTheme.colors.disabled,
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Feed",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="home" size={28} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="account-circle" size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null, // Hide from tab bar
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarStyle: {
    position: "absolute",
    bottom: 5,
    left: 20,
    right: 20,
    backgroundColor: DarkTheme.colors.surface,
    borderRadius: 50,
    height: 55,
    justifyContent: "space-around",
    paddingBottom: 5,
    borderBlockColor: DarkTheme.colors.transparent,
  },
});
