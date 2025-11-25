import React from "react";
import { View, StyleSheet, Text } from "react-native";
import DarkTheme from "@/styles/theme";

const SettingsScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings Screen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    backgroundColor: DarkTheme.colors.background,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
    color: DarkTheme.colors.text,
  },
});

export default SettingsScreen;
