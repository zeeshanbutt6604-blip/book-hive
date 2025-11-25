import { useState, useEffect } from "react";
import { Audio } from "expo-av";
import * as Linking from "expo-linking";
import * as MediaLibrary from "expo-media-library";
import { Alert } from "react-native";

export const requestMicrophonePermission = async () => {
  const { status } = await Audio.requestPermissionsAsync();

  if (status !== "granted") {
    Alert.alert(
      "Microphone Permission Needed",
      "Please enable microphone access in your device settings to record audio.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Open Settings", onPress: () => Linking.openSettings() },
      ]
    );
    return false;
  }
  return true;
};

export const requestMediaPermission = async (): Promise<boolean> => {
  const { status } = await MediaLibrary.requestPermissionsAsync();

  if (status !== "granted") {
    Alert.alert(
      "Media Permission Needed",
      "Please enable photos access in your device settings to save media.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Open Settings", onPress: () => Linking.openSettings() },
      ]
    );
    return false;
  }
  return true;
};
