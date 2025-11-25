import React from "react";
import { View, TextInput, Text, StyleSheet, TextInputProps } from "react-native";
import DarkTheme from "@/styles/theme";

interface InputFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: object;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  error,
  containerStyle,
  ...textInputProps
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, error && styles.inputError]}
        placeholderTextColor={DarkTheme.colors.disabled}
        {...textInputProps}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: DarkTheme.colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: DarkTheme.colors.surface,
    borderWidth: 1,
    borderColor: DarkTheme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: DarkTheme.colors.text,
  },
  inputError: {
    borderColor: DarkTheme.colors.danger,
  },
  errorText: {
    color: DarkTheme.colors.danger,
    fontSize: 12,
    marginTop: 4,
  },
});

export default InputField;

