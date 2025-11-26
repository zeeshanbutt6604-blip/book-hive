import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import DarkTheme from "@/styles/theme";

export default function Loader() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={DarkTheme.colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: DarkTheme.colors.background,
  },
});
