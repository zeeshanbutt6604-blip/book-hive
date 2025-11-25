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

  const validate = () => {
    const newErrors = { name: "", email: "", password: "", confirmPassword: "" };
    let isValid = true;

    if (!name.trim()) {
      newErrors.name = "Name is required";
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
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
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

  const handleSignUp = async () => {
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      const response = await authService.register({
        name,
        email,
        password,
        confirmPassword,
      });

      if (response.success) {
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
        Alert.alert("Error", response.message || "Failed to create account. Please try again.");
      }
    } catch (error: any) {
      console.error("Sign up error:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to create account. Please check your connection and try again."
      );
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
            <InputField
              label="Full Name"
              placeholder="Enter your full name"
              value={name}
              onChangeText={(text) => {
                setName(text);
                setErrors({ ...errors, name: "" });
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

            <InputField
              label="Confirm Password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                setErrors({ ...errors, confirmPassword: "" });
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
});

export default SignUpScreen;

