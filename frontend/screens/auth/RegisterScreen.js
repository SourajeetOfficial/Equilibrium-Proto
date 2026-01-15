"use client"

import { useState } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import authService from "../../services/authService"

export default function RegisterScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    consentGiven: false,
  })
  const [passwordMatch, setPasswordMatch] = useState(true)
  const [consentError, setConsentError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false,
  })

  const ALLOWED_EMAIL_DOMAINS = [
    "gmail.com",
    "outlook.com",
    "hotmail.com",
    "yahoo.com",
    "icloud.com",
    "proton.me",
    "protonmail.com",
  ]

  const checkPasswordStrength = (password) => {
    setPasswordValidation({
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*()]/.test(password),
    })
  }

  const validatePassword = (password) => {
    const allPoliciesMet = Object.values(passwordValidation).every(Boolean)
    return allPoliciesMet ? "" : "Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character."
  }

  const validateUsername = (username) => {
    if (username.length < 3 || username.length > 20) {
      return "Username must be between 3 and 20 characters long."
    }
    const safeUsernameRegex = /^[a-zA-Z0-9_]+$/
    if (!safeUsernameRegex.test(username)) {
      return "Username can only contain letters, numbers, and underscores."
    }
    return ""
  }

  const handleInputChange = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value }

      if (field === "password") {
        checkPasswordStrength(value)
        setPasswordMatch(
          value === updated.confirmPassword || updated.confirmPassword.length === 0
        )
      }

      if (field === "confirmPassword") {
        setPasswordMatch(
          value === updated.password || value.length === 0
        )
      }

      if (field === "consentGiven") {
        setConsentError(false)
      }

      return updated
    })
  }


  const validateForm = () => {
    const usernameError = validateUsername(formData.username.trim())
    if (usernameError) {
      Alert.alert("Validation Error", usernameError)
      return false
    }

    const email = formData.email.trim().toLowerCase()

    if (!email) {
      Alert.alert("Validation Error", "Please enter your email address")
      return false
    }

    const emailParts = email.split("@")
    if (emailParts.length !== 2) {
      Alert.alert("Validation Error", "Invalid email format")
      return false
    }

    if (!ALLOWED_EMAIL_DOMAINS.includes(emailParts[1])) {
      Alert.alert(
        "Validation Error",
        "Please use a supported email provider (Gmail, Outlook, Yahoo, etc.)"
      )
      return false
    }
    
    const passwordError = validatePassword(formData.password)
    if (passwordError) {
      Alert.alert("Validation Error", passwordError)
      return false
    }

    if (!passwordMatch) {
      Alert.alert("Validation Error", "Passwords do not match")
      return false
    }

    if (!formData.consentGiven) {
      setConsentError(true)
      return false
    }

    return true
  }

  const handleRegister = async () => {
  if (!validateForm()) return;

  setLoading(true);

  try {
    const userData = {
      username: formData.username.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      // consentGiven is no longer sent to the backend on registration
    };

    const result = await authService.register(userData);

    if (result.success) {
      Alert.alert(
        "Verification Required",
        "A verification email has been sent to your address. Please click the link to complete your registration.",
        [{ text: "OK", onPress: () => navigation.navigate("Login") }] // Redirect to Login
      );
    } else {
      Alert.alert("Registration Failed", result.message || "Please try again.");
    }
    } catch (error) {
      console.error("Registration error:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderValidationItem = (isValid, message) => (
    <View style={styles.validationItem}>
      <Ionicons
        name={isValid ? "checkmark-circle-sharp" : "close-circle-sharp"}
        size={16}
        color={isValid ? "#059669" : "#ef4444"}
        style={styles.validationIcon}
      />
      <Text style={[styles.validationText, { color: isValid ? "#059669" : "#ef4444" }]}>{message}</Text>
    </View>
  )

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient colors={["#d1fae5", "#dbeafe"]} style={styles.gradient}>
        <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color="#374151" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Create Account</Text>
              <Text style={styles.headerSubtitle}>Join Equilibrium and start your wellness journey</Text>
            </View>

            {/* Form */}
            <View style={styles.formContainer}>
              {/* Username Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Username</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={20} color="#6b7280" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Create a username"
                    placeholderTextColor="#9ca3af"
                    value={formData.username}
                    onChangeText={(value) => handleInputChange("username", value)}
                    autoCapitalize="none"
                  />
                </View>
                {formData.username.length > 0 && (
                  <Text style={styles.usernameHint}>
                    (3-20 characters, letters, numbers, and underscores only)
                  </Text>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="mail-outline" size={20} color="#6b7280" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter your email"
                    placeholderTextColor="#9ca3af"
                    value={formData.email}
                    onChangeText={(value) => handleInputChange("email", value)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={20} color="#6b7280" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.textInput, { flex: 1 }]}
                    placeholder="Create a password"
                    placeholderTextColor="#9ca3af"
                    value={formData.password}
                    onChangeText={(value) => handleInputChange("password", value)}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#6b7280" />
                  </TouchableOpacity>
                </View>
                {formData.password.length > 0 && (
                  <View style={styles.validationContainer}>
                    {renderValidationItem(passwordValidation.minLength, "Minimum 8 characters")}
                    {renderValidationItem(passwordValidation.hasUppercase, "At least one uppercase letter")}
                    {renderValidationItem(passwordValidation.hasLowercase, "At least one lowercase letter")}
                    {renderValidationItem(passwordValidation.hasNumber, "At least one number")}
                    {renderValidationItem(passwordValidation.hasSpecialChar, "At least one special character")}
                  </View>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Confirm Password</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={20} color="#6b7280" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.textInput, { flex: 1 }]}
                    placeholder="Confirm your password"
                    placeholderTextColor="#9ca3af"
                    value={formData.confirmPassword}
                    onChangeText={(value) => handleInputChange("confirmPassword", value)}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                  />
                  {!passwordMatch && (
                    <Text
                      style={{
                        color: "#ef4444",
                        fontSize: 12,
                        marginTop: 4,
                        paddingLeft: 16,
                      }}
                    >
                      Passwords do not match
                    </Text>
                  )}
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeButton}
                  >
                    <Ionicons
                      name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color="#6b7280"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Consent Checkbox */}
              <TouchableOpacity
                style={styles.consentContainer}
                onPress={() => handleInputChange("consentGiven", !formData.consentGiven)}
              >
                <View style={[styles.checkbox, formData.consentGiven && styles.checkboxChecked, consentError && !formData.consentGiven && { borderColor: "#ef4444" }]}>
                  {formData.consentGiven && <Ionicons name="checkmark" size={16} color="#ffffff" />}
                </View>
                <Text style={[styles.consentText, consentError && !formData.consentGiven && { color: "#ef4444" }]}>
                  I agree to the <Text style={styles.consentLink}>Privacy Policy</Text> and{" "}
                  <Text style={styles.consentLink}>Terms of Service</Text>
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.registerButton, loading && styles.registerButtonDisabled]}
                onPress={handleRegister}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.registerButtonText}>Create Account</Text>
                )}
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate("Login")}>
                <Text style={styles.loginLinkText}>
                  Already have an account? <Text style={styles.loginLinkBold}>Sign In</Text>
                </Text>
              </TouchableOpacity>
            </View>

            {/* Privacy Note */}
            <View style={styles.privacyNote}>
              <Ionicons name="shield-checkmark" size={16} color="#059669" />
              <Text style={styles.privacyText}>
                Your data is encrypted and secure. We never share your information.
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  backButton: {
    alignSelf: "flex-start",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
  },
  formContainer: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: "#374151",
  },
  eyeButton: {
    padding: 4,
  },
  usernameHint: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
    paddingLeft: 16,
  },
  validationContainer: {
    marginTop: 8,
    paddingLeft: 16,
  },
  validationItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 8,
  },
  validationText: {
    fontSize: 12,
  },
  validationIcon: {
    width: 16,
  },
  consentContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#d1d5db",
    marginRight: 12,
    marginTop: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: "#059669",
    borderColor: "#059669",
  },
  consentText: {
    flex: 1,
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
  },
  consentLink: {
    color: "#059669",
    fontWeight: "500",
  },
  registerButton: {
    backgroundColor: "#059669",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  registerButtonDisabled: {
    opacity: 0.7,
  },
  registerButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e5e7eb",
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: "#6b7280",
  },
  loginLink: {
    alignItems: "center",
    marginBottom: 20,
  },
  loginLinkText: {
    fontSize: 14,
    color: "#6b7280",
  },
  loginLinkBold: {
    color: "#059669",
    fontWeight: "600",
  },
  privacyNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderRadius: 12,
    marginTop: "auto",
  },
  privacyText: {
    fontSize: 12,
    color: "#059669",
    fontWeight: "500",
    textAlign: "center",
    flex: 1,
  },
})