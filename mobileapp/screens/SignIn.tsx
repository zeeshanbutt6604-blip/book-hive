import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import InputField from "@/components/InputField";
import Button from "@/components/Button";
import DarkTheme from "@/styles/theme";
import {
  responsiveFontSize,
  responsiveScreenHeight,
  responsiveScreenWidth,
} from "react-native-responsive-dimensions";
import { authService } from "@/services/authService";
import { ActivityIndicator, Alert } from "react-native";

const SignInScreen: React.FC = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const newErrors = { email: "", password: "" };
    let isValid = true;

    if (!email.trim()) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
      isValid = false;
    }

    if (!password.trim()) {
      newErrors.password = "Password is required";
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSignIn = async () => {
    if (!validate()) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await authService.login(email.trim(), password);
      
      if (response.success) {
        router.replace("/(tabs)");
      } else {
        Alert.alert("Error", response.message || "Login failed");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[DarkTheme.colors.background, DarkTheme.colors.surface]}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoContainer}>
            <View style={styles.iconCircle}>
              <MaterialIcons
                name="auto-stories"
                size={60}
                color={DarkTheme.colors.primary}
              />
            </View>
            <Text style={styles.appName}>BookHive</Text>
            <Text style={styles.welcomeText}>Welcome Back!</Text>
            <Text style={styles.subText}>Sign in to continue your reading journey</Text>
          </View>

          <View style={styles.formContainer}>
            <InputField
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setErrors({ ...errors, email: "" });
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
              containerStyle={styles.input}
            />

            <InputField
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setErrors({ ...errors, password: "" });
              }}
              secureTextEntry
              error={errors.password}
              containerStyle={styles.input}
            />

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <Button
              title={isLoading ? "Signing In..." : "Sign In"}
              onPress={handleSignIn}
              disabled={isLoading}
              customStyle={styles.signInButton}
            />

            <View style={styles.signUpContainer}>
              <Text style={styles.signUpText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push("/(routes)/signup")}>
                <Text style={styles.signUpLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: responsiveScreenWidth(6),
    paddingTop: responsiveScreenHeight(8),
    paddingBottom: responsiveScreenHeight(4),
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: responsiveScreenHeight(6),
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: DarkTheme.colors.surface,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    elevation: 10,
    shadowColor: DarkTheme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  appName: {
    fontSize: responsiveFontSize(3.5),
    fontWeight: "bold",
    color: DarkTheme.colors.text,
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: responsiveFontSize(2.5),
    fontWeight: "600",
    color: DarkTheme.colors.text,
    marginTop: 8,
  },
  subText: {
    fontSize: responsiveFontSize(1.8),
    color: DarkTheme.colors.subtext,
    textAlign: "center",
    marginTop: 4,
  },
  formContainer: {
    width: "100%",
  },
  input: {
    marginBottom: 12,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 24,
    marginTop: -8,
  },
  forgotPasswordText: {
    color: DarkTheme.colors.primary,
    fontSize: responsiveFontSize(1.8),
  },
  signInButton: {
    marginTop: 8,
  },
  signUpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  signUpText: {
    color: DarkTheme.colors.subtext,
    fontSize: responsiveFontSize(1.8),
  },
  signUpLink: {
    color: DarkTheme.colors.primary,
    fontSize: responsiveFontSize(1.8),
    fontWeight: "600",
  },
});

export default SignInScreen;

