// Task: M02 | Path: mobile/src/screens/SignInScreen.tsx

import React, { useState } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../services/api";

const SignInScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSignIn = async () => {
    setErrorMessage("");

    if (!email.trim() || !password.trim()) {
      setErrorMessage("Email and password are required.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/auth/signin", {
        universityEmail: email.trim(),
        password
      });

      const { accessToken, selectedCampusId } = response.data;

      await AsyncStorage.setItem("authToken", accessToken);

      if (!selectedCampusId) {
        navigation.reset({
          index: 0,
          routes: [{ name: "CampusSelection" }]
        });
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: "Home" }]
        });
      }
    } catch (err: any) {
      const errorCode = err?.response?.data?.error?.code;
      switch (errorCode) {
        case "INVALID_CREDENTIALS":
          setErrorMessage("Invalid email or password.");
          break;
        case "ACCOUNT_NOT_VERIFIED":
          setErrorMessage("Please verify your email before signing in.");
          break;
        case "ACCOUNT_SUSPENDED":
          setErrorMessage("Your account has been suspended. Please contact support.");
          break;
        case "ACCOUNT_BANNED":
          setErrorMessage("Your account has been banned.");
          break;
        default:
          setErrorMessage("Sign in failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const navigateToSignUp = () => {
    navigation.navigate("SignUp");
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in with your university email</Text>

        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

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
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          editable={!loading}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSignIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={navigateToSignUp} style={styles.linkContainer}>
          <Text style={styles.link}>Don't have an account? Sign Up</Text>
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

export default SignInScreen;
