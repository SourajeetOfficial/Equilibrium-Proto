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
import authService from "../services/authService"

export default function ChangePasswordScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  })
  const [loading, setLoading] = useState(false)
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false,
  })

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
    return allPoliciesMet
      ? ""
      : "Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character."
  }

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (field === "newPassword") {
      checkPasswordStrength(value)
    }
  }

  const handleSavePassword = async () => {
    if (!formData.oldPassword) {
      Alert.alert("Validation Error", "Please enter your old password.")
      return
    }
    if (!formData.newPassword) {
      Alert.alert("Validation Error", "Please enter a new password.")
      return
    }
    const passwordError = validatePassword(formData.newPassword)
    if (passwordError) {
      Alert.alert("Validation Error", passwordError)
      return
    }
    if (formData.newPassword !== formData.confirmNewPassword) {
      Alert.alert("Validation Error", "New passwords do not match.")
      return
    }

    setLoading(true)
    try {
      const result = await authService.changePassword(formData.oldPassword, formData.newPassword)
      if (result.success) {
        Alert.alert("Success", "Your password has been changed successfully.")
        navigation.goBack() // Go back to the profile screen
      } else {
        Alert.alert("Error", result.message || "Failed to change password.")
      }
    } catch (error) {
      Alert.alert("Error", "Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

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
      <LinearGradient colors={["#f0f9ff", "#e0f2fe"]} style={styles.gradient}>
        <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color="#374151" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Change Password</Text>
              <Text style={styles.headerSubtitle}>Update your password for security</Text>
            </View>

            {/* Form */}
            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Old Password</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={20} color="#6b7280" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter old password"
                    placeholderTextColor="#9ca3af"
                    value={formData.oldPassword}
                    onChangeText={(value) => handleInputChange("oldPassword", value)}
                    secureTextEntry={!showOldPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowOldPassword(!showOldPassword)} style={styles.eyeButton}>
                    <Ionicons name={showOldPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#6b7280" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>New Password</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={20} color="#6b7280" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter new password"
                    placeholderTextColor="#9ca3af"
                    value={formData.newPassword}
                    onChangeText={(value) => handleInputChange("newPassword", value)}
                    secureTextEntry={!showNewPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)} style={styles.eyeButton}>
                    <Ionicons name={showNewPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#6b7280" />
                  </TouchableOpacity>
                </View>
                {formData.newPassword.length > 0 && (
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
                <Text style={styles.inputLabel}>Confirm New Password</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={20} color="#6b7280" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Confirm new password"
                    placeholderTextColor="#9ca3af"
                    value={formData.confirmNewPassword}
                    onChangeText={(value) => handleInputChange("confirmNewPassword", value)}
                    secureTextEntry={!showNewPassword} // Use the same visibility as new password
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSavePassword}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.buttonText}>Save New Password</Text>}
              </TouchableOpacity>
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
    marginBottom: 40,
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
    marginBottom: 20,
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
  button: {
    backgroundColor: "#3b82f6",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
})
