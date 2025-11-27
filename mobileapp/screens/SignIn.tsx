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
  const [generalError, setGeneralError] = useState("");

  const validate = () => {
    const newErrors = { email: "", password: "" };
    let isValid = true;
    setGeneralError(""); // Clear general error on validation

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

  const getErrorMessage = (error: any): string => {
    // Check for formatted error from API interceptor first
    const status = error.status || error.response?.status;
    const errorMessage = error.response?.data?.message || error.message || "An error occurred";

    // Network errors (no response or status 0)
    if (!error.response && !status) {
      if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND" || error.code === "NETWORK_ERROR") {
        return "Cannot connect to server. Please check your internet connection and try again.";
      }
      if (error.message && (error.message.includes("timeout") || error.originalError?.includes("timeout"))) {
        return "Request timed out. Please check your connection and try again.";
      }
      if (error.originalError) {
        return `Network error: ${error.originalError}. Please check your connection and try again.`;
      }
      return "Network error. Please check your internet connection and try again.";
    }

    // Handle specific status codes
    switch (status) {
      case 0:
        // Network error with status 0
        return errorMessage || "Network error. Please check your internet connection and try again.";
      case 400:
        if (errorMessage.toLowerCase().includes("invalid") || errorMessage.toLowerCase().includes("credentials")) {
          return "Invalid email or password. Please check your credentials and try again.";
        }
        return errorMessage || "Invalid request. Please check your input and try again.";
      case 401:
        if (errorMessage.toLowerCase().includes("session") || errorMessage.toLowerCase().includes("expired")) {
          return "Session expired. Please sign in again.";
        }
        return "Invalid email or password. Please check your credentials and try again.";
      case 403:
        if (errorMessage.toLowerCase().includes("verify") || errorMessage.toLowerCase().includes("email")) {
          return "Please verify your email to access your account. Check your inbox for the verification link.";
        }
        return errorMessage || "Access denied. Please check your account status.";
      case 404:
        return "Service not found. Please try again later.";
      case 500:
      case 502:
      case 503:
        return "Server error. Please try again in a few moments.";
      default:
        return errorMessage || "An unexpected error occurred. Please try again.";
    }
  };

  const handleSignIn = async () => {
    if (!validate()) {
      return;
    }

    try {
      setIsLoading(true);
      setGeneralError(""); // Clear any previous errors
      const response = await authService.login(email.trim(), password);
      
      if (response.success) {
        // Clear form on success
        setEmail("");
        setPassword("");
        setErrors({ email: "", password: "" });
        router.replace("/(tabs)");
      } else {
        const errorMsg = response.message || "Login failed. Please check your credentials.";
        setGeneralError(errorMsg);
        Alert.alert("Sign In Failed", errorMsg);
      }
    } catch (error: any) {
      console.error("Sign in error:", error);
      const errorMessage = getErrorMessage(error);
      setGeneralError(errorMessage);
      Alert.alert("Sign In Failed", errorMessage);
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
            {generalError ? (
              <View style={styles.errorBanner}>
                <MaterialIcons
                  name="error-outline"
                  size={20}
                  color={DarkTheme.colors.danger}
                />
                <Text style={styles.errorBannerText}>{generalError}</Text>
                <TouchableOpacity
                  onPress={() => setGeneralError("")}
                  style={styles.errorCloseButton}
                >
                  <MaterialIcons
                    name="close"
                    size={18}
                    color={DarkTheme.colors.danger}
                  />
                </TouchableOpacity>
              </View>
            ) : null}

            <InputField
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setErrors({ ...errors, email: "" });
                setGeneralError(""); // Clear general error when user types
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
                setGeneralError(""); // Clear general error when user types
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
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${DarkTheme.colors.danger}15`,
    borderLeftWidth: 4,
    borderLeftColor: DarkTheme.colors.danger,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorBannerText: {
    flex: 1,
    color: DarkTheme.colors.danger,
    fontSize: responsiveFontSize(1.6),
    marginLeft: 8,
    marginRight: 8,
  },
  errorCloseButton: {
    padding: 4,
  },
});

export default SignInScreen;

