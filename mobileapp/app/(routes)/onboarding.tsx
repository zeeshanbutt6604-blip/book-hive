import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet } from "react-native";
import AppIntroSlider from "react-native-app-intro-slider";
import LottieView from "lottie-react-native";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import {
  useFonts,
  Raleway_700Bold,
  Raleway_500Medium,
} from "@expo-google-fonts/raleway";
import { Nunito_400Regular } from "@expo-google-fonts/nunito";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import DarkTheme from "@/styles/theme";
import { useRouter } from "expo-router";

interface Slide {
  key: string;
  title: string;
  subtitle: string;
  paragraph: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  backgroundColor: string;
}

const slides: Slide[] = [
  {
    key: "1",
    title: "Discover Amazing Books",
    subtitle: "Explore a World of Stories",
    paragraph: "Find your next favorite read from thousands of book recommendations shared by our community of book lovers.",
    icon: "auto-stories",
    backgroundColor: DarkTheme.colors.background,
  },
  {
    key: "2",
    title: "Share Your Reading Journey",
    subtitle: "Connect with Readers",
    paragraph: "Post about the books you're reading, share your thoughts, and engage with fellow book enthusiasts.",
    icon: "share",
    backgroundColor: DarkTheme.colors.background,
  },
  {
    key: "3",
    title: "Join the Community",
    subtitle: "Start Your Journey Today",
    paragraph: "Create your profile, start sharing, and become part of an amazing community of passionate readers.",
    icon: "groups",
    backgroundColor: DarkTheme.colors.background,
  },
];

const OnboardingScreen: React.FC = () => {
  const [fontsLoaded] = useFonts({
    Raleway_700Bold,
    Raleway_500Medium,
    Nunito_400Regular,
  });
  const router = useRouter();

  const handleDone = () => {
    router.replace("/(routes)/signin");
  };

  const renderItem = ({ item }: { item: Slide }) => {
    return (
      <LinearGradient
        colors={[DarkTheme.colors.background, DarkTheme.colors.surface]}
        style={styles.slide}
      >
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <MaterialIcons name={item.icon} size={80} color={DarkTheme.colors.primary} />
          </View>
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.subtitle}>{item.subtitle}</Text>
          <Text style={styles.para}>{item.paragraph}</Text>
        </View>
      </LinearGradient>
    );
  };

  const renderNextButton = () => {
    return (
      <View style={styles.buttonCircle}>
        <MaterialIcons
          name="arrow-forward"
          color="white"
          size={24}
          style={{ backgroundColor: DarkTheme.colors.transparent }}
        />
      </View>
    );
  };

  const renderDoneButton = () => {
    return (
      <LinearGradient
        colors={DarkTheme.colors.gradient}
        style={styles.buttonCircle}
        start={[0, 0]}
        end={[1, 1]}
      >
        <MaterialIcons
          name="check"
          color="white"
          size={24}
          style={{ backgroundColor: DarkTheme.colors.transparent }}
        />
      </LinearGradient>
    );
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.container}>
      <AppIntroSlider
        data={slides}
        renderItem={renderItem}
        renderDoneButton={renderDoneButton}
        renderNextButton={renderNextButton}
        onDone={handleDone}
        dotStyle={styles.dot}
        activeDotStyle={styles.activeDot}
        showSkipButton
        skipLabel="Skip"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DarkTheme.colors.background,
  },
  slide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: wp("5%"),
  },
  iconContainer: {
    width: wp("100%"),
    height: hp("40%"),
    justifyContent: "center",
    alignItems: "center",
  },
  iconCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: DarkTheme.colors.surface,
    justifyContent: "center",
    alignItems: "center",
    elevation: 10,
    shadowColor: DarkTheme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  textContainer: {
    alignItems: "center",
    marginTop: hp("3%"),
    paddingHorizontal: wp("8%"),
  },
  title: {
    fontSize: wp("7%"),
    fontFamily: "Raleway_700Bold",
    color: DarkTheme.colors.text,
    textAlign: "center",
    marginBottom: hp("1%"),
  },
  subtitle: {
    fontSize: wp("5%"),
    fontFamily: "Raleway_500Medium",
    color: DarkTheme.colors.primary,
    textAlign: "center",
    marginBottom: hp("2%"),
  },
  para: {
    fontSize: wp("4%"),
    fontFamily: "Nunito_400Regular",
    color: DarkTheme.colors.subtext,
    textAlign: "center",
    lineHeight: wp("6%"),
  },
  buttonCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  dot: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: DarkTheme.colors.primary,
    width: 24,
    height: 8,
    borderRadius: 4,
  },
});

export default OnboardingScreen;
