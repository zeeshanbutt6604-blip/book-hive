import React, { useEffect } from "react";
import { View, StyleSheet, Text, Animated } from "react-native";
import DarkTheme from "@/styles/theme";
import * as Linking from "expo-linking";
import { Alert, Platform } from "react-native";
import LottieView from "lottie-react-native";
import {
  responsiveHeight,
  responsiveFontSize,
  responsiveScreenWidth,
  responsiveScreenHeight,
} from "react-native-responsive-dimensions";

import Button from "@/components/Button";

const NoInternetComponent: React.FC = () => {
  const pulseAnim = new Animated.Value(1);

  async function openDeviceSettings() {
    try {
      if (Platform.OS === "ios") {
        await Linking.openURL("App-Prefs:root=");
      } else if (Platform.OS === "android") {
        await Linking.sendIntent("android.settings.SETTINGS");
      }
    } catch (error) {
      Alert.alert("Error", "Unable to open device settings.");
    }
  }

  useEffect(() => {
    Alert.alert(
      "No Internet Connection",
      "Please check your internet connection and try again!",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Open Settings", onPress: openDeviceSettings },
      ]
    );
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          {
            width: "100%",
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <LottieView
          source={require("@/assets/animation/connection-broken.json")}
          autoPlay
          loop
          style={styles.connectionBrokenAnimation}
        />
      </Animated.View>
      <View style={styles.subContainer}>
        <Text style={styles.title}>No Internet Connection</Text>
        <Text style={styles.body}>
          Please check your internet connection and try again!
        </Text>
        <Button
          title="Open settings"
          customStyle={styles.openSettingsButton}
          onPress={openDeviceSettings}
        ></Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: DarkTheme.colors.background,
    zIndex: 9999,
    position: "absolute",
    top: 0,
    left: 0,
    height: "100%",
    width: "100%",
  },
  subContainer: {
    marginTop: 50,
    paddingHorizontal: 50,
  },
  animation: {
    width: responsiveScreenWidth(100),
    height: responsiveScreenHeight(50),
  },
  title: {
    color: DarkTheme.colors.primary,
    fontSize: responsiveFontSize(3),
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 15,
  },
  body: {
    color: DarkTheme.colors.white,
    fontSize: responsiveFontSize(2),
    textAlign: "center",
    marginTop: 15,
  },
  openSettingsButton: {
    marginTop: 15,
  },
  connectionBrokenAnimation: {
    position: "absolute",
    top: responsiveHeight(-30),
    left: 0,
    right: 0,
    bottom: 0,
    width: responsiveScreenWidth(100),
    height: responsiveScreenHeight(50),
    zIndex: 1,
  },
});

export default NoInternetComponent;
