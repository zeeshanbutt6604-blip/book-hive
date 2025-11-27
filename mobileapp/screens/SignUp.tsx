import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import InputField from "@/components/InputField";
import Button from "@/components/Button";
import DarkTheme from "@/styles/theme";
import { authService } from "@/services/authService";
import {
  responsiveFontSize,
  responsiveScreenHeight,
  responsiveScreenWidth,
} from "react-native-responsive-dimensions";

const SignUpScreen: React.FC = () => {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({ 
    name: "", 
    email: "", 
    password: "", 
    confirmPassword: "" 
  });
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState("");

  const validate = () => {
    const newErrors = { name: "", email: "", password: "", confirmPassword: "" };
    let isValid = true;
    setGeneralError(""); // Clear general error on validation

    if (!name.trim()) {
      newErrors.name = "Name is required";
      isValid = false;
    } else if (name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
      isValid = false;
    }

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
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
      isValid = false;
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      newErrors.password = "Password must contain uppercase, lowercase, and number";
      isValid = false;
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = "Please confirm your password";
      isValid = false;
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
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
        if (errorMessage.toLowerCase().includes("already exists") || errorMessage.toLowerCase().includes("email")) {
          return "This email is already registered. Please use a different email or sign in.";
        }
        if (errorMessage.toLowerCase().includes("password")) {
          return "Password does not meet requirements. It must be at least 8 characters with uppercase, lowercase, and a number.";
        }
        if (errorMessage.toLowerCase().includes("validation")) {
          return "Please check all fields and ensure they meet the requirements.";
        }
        return errorMessage || "Invalid request. Please check your input and try again.";
      case 409:
        return "This email is already registered. Please use a different email or sign in.";
      case 500:
      case 502:
      case 503:
        return "Server error. Please try again in a few moments.";
      default:
        return errorMessage || "An unexpected error occurred. Please try again.";
    }
  };

  const handleSignUp = async () => {
    if (!validate()) {
      return;
    }

    setLoading(true);
    setGeneralError(""); // Clear any previous errors
    try {
      const response = await authService.register({
        name: name.trim(),
        email: email.trim(),
        password,
        confirmPassword,
      });

      if (response.success) {
        // Clear form on success
        setName("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setErrors({ name: "", email: "", password: "", confirmPassword: "" });
        setGeneralError("");

        // Show success message
        Alert.alert(
          "🎉 Congratulations!",
          response.message || "Your account has been created successfully! Please check your email to activate your account.",
          [
            {
              text: "OK",
              onPress: () => {
                // Navigate to login screen
                router.replace("/(routes)/signin");
              },
            },
          ],
          { cancelable: false }
        );
      } else {
        const errorMsg = response.message || "Failed to create account. Please try again.";
        setGeneralError(errorMsg);
        Alert.alert("Sign Up Failed", errorMsg);
      }
    } catch (error: any) {
      console.error("Sign up error:", error);
      const errorMessage = getErrorMessage(error);
      setGeneralError(errorMessage);
      Alert.alert("Sign Up Failed", errorMessage);
    } finally {
      setLoading(false);
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
            <Text style={styles.welcomeText}>Create Account</Text>
            <Text style={styles.subText}>Join our community of book lovers</Text>
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
              label="Full Name"
              placeholder="Enter your full name"
              value={name}
              onChangeText={(text) => {
                setName(text);
                setErrors({ ...errors, name: "" });
                setGeneralError(""); // Clear general error when user types
              }}
              error={errors.name}
              containerStyle={styles.input}
            />

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
              placeholder="Enter your password (min 8 chars, uppercase, lowercase, number)"
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

            <InputField
              label="Confirm Password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                setErrors({ ...errors, confirmPassword: "" });
                setGeneralError(""); // Clear general error when user types
              }}
              secureTextEntry
              error={errors.confirmPassword}
              containerStyle={styles.input}
            />

            <Button
              title={loading ? "Creating Account..." : "Sign Up"}
              onPress={handleSignUp}
              disabled={loading}
              customStyle={styles.signUpButton}
            />

            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={DarkTheme.colors.primary} />
              </View>
            )}

            <View style={styles.signInContainer}>
              <Text style={styles.signInText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.back()}>
                <Text style={styles.signInLink}>Sign In</Text>
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
    paddingTop: responsiveScreenHeight(6),
    paddingBottom: responsiveScreenHeight(4),
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: responsiveScreenHeight(4),
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
  signUpButton: {
    marginTop: 16,
  },
  signInContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  signInText: {
    color: DarkTheme.colors.subtext,
    fontSize: responsiveFontSize(1.8),
  },
  signInLink: {
    color: DarkTheme.colors.primary,
    fontSize: responsiveFontSize(1.8),
    fontWeight: "600",
  },
  loadingContainer: {
    alignItems: "center",
    marginTop: 12,
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

export default SignUpScreen;

