// Task: M02 | Path: mobile/src/screens/SignUpScreen.tsx

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import api from "../services/api";

type SignUpStep = "register" | "verify";

const SignUpScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [studentId, setStudentId] = useState("");

  const [verificationToken, setVerificationToken] = useState("");

  const [step, setStep] = useState<SignUpStep>("register");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSignUp = async () => {
    setErrorMessage("");

    if (!email.trim() || !password.trim() || !studentId.trim()) {
      setErrorMessage("All fields are required.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/signup", {
        universityEmail: email.trim(),
        password,
        universityStudentId: studentId.trim()
      });

      setStep("verify");
    } catch (err: any) {
      const errorCode = err?.response?.data?.error?.code;
      switch (errorCode) {
        case "UNSUPPORTED_EMAIL_DOMAIN":
          setErrorMessage(
            "This email domain is not supported. Please use your university email."
          );
          break;
        case "CONFLICT":
          setErrorMessage("An account with this email already exists.");
          break;
        case "VALIDATION_ERROR":
          setErrorMessage("Please check your details and try again.");
          break;
        default:
          setErrorMessage("Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setErrorMessage("");

    if (!verificationToken.trim()) {
      setErrorMessage("Please enter the verification code.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/verify-email", {
        email: email.trim(),
        token: verificationToken.trim()
      });

      Alert.alert("Account Verified", "Your account has been activated. Please sign in.", [
        { text: "OK", onPress: () => navigation.navigate("SignIn") }
      ]);
    } catch (err: any) {
      const errorCode = err?.response?.data?.error?.code;
      switch (errorCode) {
        case "INVALID_VERIFICATION_TOKEN":
          setErrorMessage("Invalid verification code. Please check and try again.");
          break;
        case "NOT_FOUND":
          setErrorMessage("Account not found. Please sign up again.");
          break;
        case "VALIDATION_ERROR":
          setErrorMessage("Please check your verification details and try again.");
          break;
        default:
          setErrorMessage("Verification failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const navigateToSignIn = () => {
    navigation.navigate("SignIn");
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{step === "register" ? "Create Account" : "Verify Email"}</Text>
        <Text style={styles.subtitle}>
          {step === "register"
            ? "Use your university email to sign up"
            : "Enter the verification code sent to your email"}
        </Text>

        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

        {step === "register" ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="University email"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              editable={!loading}
            />
            <TextInput
              style={styles.input}
              placeholder="University student ID"
              autoCapitalize="none"
              value={studentId}
              onChangeText={setStudentId}
              editable={!loading}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              editable={!loading}
            />
            <TextInput
              style={styles.input}
              placeholder="Confirm password"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              editable={!loading}
            />
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSignUp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Sign Up</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder="Verification code"
              autoCapitalize="none"
              value={verificationToken}
              onChangeText={setVerificationToken}
              editable={!loading}
            />
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleVerify}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Verify</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity onPress={navigateToSignIn} style={styles.linkContainer}>
          <Text style={styles.link}>Already have an account? Sign In</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40
  },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 8, textAlign: "center" },
  subtitle: {
    fontSize: 15,
    color: "#666",
    marginBottom: 24,
    textAlign: "center"
  },
  error: {
    color: "#d32f2f",
    fontSize: 14,
    marginBottom: 16,
    textAlign: "center"
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12
  },
  button: {
    backgroundColor: "#1976d2",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  linkContainer: { marginTop: 24, alignItems: "center" },
  link: { color: "#1976d2", fontSize: 14 }
});

export default SignUpScreen;
