import React from "react";
import { TouchableOpacity, StyleSheet, ViewStyle } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import DarkTheme from "@/styles/theme";
import { LinearGradient } from "expo-linear-gradient";

interface FloatingActionButtonProps {
  onPress: () => void;
  icon?: keyof typeof MaterialIcons.glyphMap;
  size?: number;
  style?: ViewStyle;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onPress,
  icon = "add",
  size = 56,
  style,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        style,
      ]}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={DarkTheme.colors.gradient}
        style={[
          styles.gradient,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
        start={[0, 0]}
        end={[1, 1]}
      >
        <MaterialIcons name={icon} size={size * 0.5} color={DarkTheme.colors.white} />
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  gradient: {
    justifyContent: "center",
    alignItems: "center",
  },
});

export default FloatingActionButton;

