import React from "react";
import { Text, TouchableOpacity, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import DarkTheme from "@/styles/theme";

export default function Button({
  title,
  onPress,
  customStyle,
  disabled = false,
}: {
  title: any;
  onPress: () => void;
  customStyle?: {};
  disabled: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.buttonContainer, customStyle]}
      disabled={disabled}
    >
      <LinearGradient
        colors={DarkTheme.colors.gradient}
        style={styles.button}
        start={[0, 0]}
        end={[1, 1]}
      >
        <Text style={styles.buttonText}>{title}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    borderRadius: 25,
    overflow: "hidden",
    elevation: 5, // For shadow on Android
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: "center",
    borderRadius: 25,
    shadowColor: "#000", // For shadow on iOS
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
