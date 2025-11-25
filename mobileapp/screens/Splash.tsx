// app/SplashScreen.tsx
import React, { useEffect } from "react";
import { View, StyleSheet, Text } from "react-native";
import { useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import Lottie from "lottie-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import DarkTheme from "@/styles/theme";
import { authService } from "@/services/authService";
import {
  responsiveFontSize,
  responsiveScreenHeight,
  responsiveScreenWidth,
} from "react-native-responsive-dimensions";

const SplashScreenComponent: React.FC = () => {
  const router = useRouter();

  useEffect(() => {
    const prepare = async () => {
      // Simulate loading time
      await new Promise((resolve) => setTimeout(resolve, 2500));
      SplashScreen.hideAsync();
      
      // Check if user is authenticated
      const isAuthenticated = await authService.isAuthenticated();
      
      if (isAuthenticated) {
        // User is signed in, redirect directly to Home screen
        router.replace("/(tabs)");
      } else {
        // User is not signed in, go to onboarding
      router.replace("/(routes)/onboarding");
      }
    };
    prepare();
  }, [router]);

  return (
    <LinearGradient
      colors={[DarkTheme.colors.background, DarkTheme.colors.surface]}
      style={styles.container}
    >
      <View style={styles.logoContainer}>
        <View style={styles.iconContainer}>
          <MaterialIcons name="auto-stories" size={80} color={DarkTheme.colors.primary} />
        </View>
        <Text style={styles.appName}>BookHive</Text>
        <Text style={styles.tagline}>Share Your Reading Journey</Text>
      </View>
      <View style={styles.loaderContainer}>
        <Lottie
          source={require("@/assets/animation/loading.json")}
          autoPlay
          loop
          style={styles.animation}
        />
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: DarkTheme.colors.background,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: DarkTheme.colors.surface,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    elevation: 10,
    shadowColor: DarkTheme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  appName: {
    color: DarkTheme.colors.text,
    fontSize: responsiveFontSize(4.5),
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  tagline: {
    color: DarkTheme.colors.subtext,
    fontSize: responsiveFontSize(1.8),
    textAlign: "center",
  },
  loaderContainer: {
    position: "absolute",
    bottom: 80,
  },
  animation: {
    width: responsiveScreenWidth(30),
    height: responsiveScreenHeight(15),
  },
});

export default SplashScreenComponent;
