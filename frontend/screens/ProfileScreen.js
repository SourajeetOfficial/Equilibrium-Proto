"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  Switch,
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import SafeAreaWrapper from "../components/SafeAreaWrapper"
import authService from "../services/authService"

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const [user, setUser] = useState(null)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    username: "",
    email: "",
  })
  const [preferences, setPreferences] = useState({
    usageTracking: false,
    notifications: true,
  })
  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    const currentUser = authService.getCurrentUser()
    if (currentUser) {
      setUser(currentUser)
      setFormData({
        username: currentUser.username || "",
        email: currentUser.email || "",
      })
      if (currentUser.consentFlags) {
        setPreferences({
          usageTracking: currentUser.consentFlags.usageTracking || false,
          notifications: true, // This remains a frontend-only preference for now
        })
      }
    }
  }

  const handleSaveProfile = async () => {
    try {
      if (!formData.username.trim()) {
        Alert.alert("Validation Error", "Username cannot be empty.")
        return
      }

      const result = await authService.updateProfile({ username: formData.username })

      if (result.success) {
        Alert.alert("Success", "Profile updated successfully!")
        setEditing(false)
        const updatedUser = authService.getCurrentUser()
        setUser(updatedUser)
      } else {
        Alert.alert("Error", result.message || "Failed to update profile.")
      }
    } catch (error) {
      Alert.alert("Error", "Failed to update profile")
    }
  }

  const handlePreferenceChange = async (key, value) => {
    const newPreferences = { ...preferences, [key]: value }
    setPreferences(newPreferences)

    const result = await authService.updateConsent({ [key]: value })
    if (!result.success) {
      // Revert on error
      setPreferences(preferences)
      Alert.alert("Error", result.message)
    }
  }

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await authService.logout()
        },
      },
    ])
  }

  const profileOptions = [
    {
      icon: "key-outline",
      title: "Change Password",
      subtitle: "Update your account password",
      onPress: () => navigation.navigate("ChangePassword"),
    },
    {
      icon: "settings-outline",
      title: "Settings",
      subtitle: "App preferences",
      onPress: () => navigation.navigate("Settings"),
    },
    {
      icon: "shield-checkmark-outline",
      title: "Privacy",
      subtitle: "Data & privacy settings",
      onPress: () => navigation.navigate("PrivacySettings"),
    },
    {
      icon: "help-circle-outline",
      title: "Help & Support",
      subtitle: "Get help and contact us",
      onPress: () => navigation.navigate("Help"),
    },
    {
      icon: "information-circle-outline",
      title: "About",
      subtitle: "App version and info",
      onPress: () => navigation.navigate("About"),
    },
  ]

  return (

    <SafeAreaWrapper backgroundColor="#dbeafe" statusBarStyle="dark-content">
      <LinearGradient colors={["#f0f9ff", "#e0f2fe"]} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Profile</Text>
              <Text style={styles.headerSubtitle}>Manage your account</Text>
            </View>
            <TouchableOpacity style={styles.editButton} onPress={() => setEditing(!editing)}>
              <Ionicons name={editing ? "checkmark" : "pencil"} size={20} color="#3b82f6" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Profile Info */}
          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{user?.username?.charAt(0)?.toUpperCase() || "U"}</Text>
              </View>
              {editing && (
                <TouchableOpacity style={styles.changePhotoButton}>
                  <Text style={styles.changePhotoText}>Change Photo</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.profileInfo}>
              {editing ? (
                <>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Username</Text>
                    <TextInput
                      style={styles.textInput}
                      value={formData.username}
                      onChangeText={(text) => setFormData({ ...formData, username: text })}
                      placeholder="Enter your username"
                      autoCapitalize="none"
                    />
                  </View>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Email</Text>
                    <TextInput
                      style={styles.textInput}
                      value={formData.email}
                      editable={false}
                      placeholder="Enter your email"
                      keyboardType="email-address"
                    />
                  </View>
                  <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.userName}>{user?.username || "User Name"}</Text>
                  <Text style={styles.userEmail}>{user?.email || "user@example.com"}</Text>
                </>
              )}
            </View>
          </View>

          {/* Preferences */}
          <View style={styles.preferencesCard}>
            <Text style={styles.cardTitle}>Preferences</Text>
            {/* The provided backend has a consent flag for usageTracking */}
            <View style={styles.preferenceItem}>
              <View style={styles.preferenceText}>
                <Text style={styles.preferenceTitle}>Usage Analytics</Text>
                <Text style={styles.preferenceSubtitle}>Help improve app experience</Text>
              </View>
              <Switch
                value={preferences.usageTracking}
                onValueChange={(value) => handlePreferenceChange("usageTracking", value)}
                trackColor={{ false: "#e5e7eb", true: "#10b981" }}
              />
            </View>
            {/* Notifications switch is local-only for now */}
            <View style={styles.preferenceItem}>
              <View style={styles.preferenceText}>
                <Text style={styles.preferenceTitle}>Notifications</Text>
                <Text style={styles.preferenceSubtitle}>Receive wellness reminders</Text>
              </View>
              <Switch
                value={preferences.notifications}
                onValueChange={(value) => setPreferences({ ...preferences, notifications: value })}
                trackColor={{ false: "#e5e7eb", true: "#10b981" }}
              />
            </View>
          </View>

          {/* Options */}
          <View style={styles.optionsCard}>
            {profileOptions.map((option, index) => (
              <TouchableOpacity key={index} style={[styles.optionItem, index === profileOptions.length - 1 && { borderBottomWidth: 0 }]} onPress={option.onPress}>
                <View style={styles.optionIcon}>
                  <Ionicons name={option.icon} size={20} color="#6b7280" />
                </View>
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>{option.title}</Text>
                  <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </TouchableOpacity>
            ))}
          </View>

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#dc2626" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>

          <View style={{ height: 100 }} />
        </ScrollView>
      </LinearGradient>
    </SafeAreaWrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#374151",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6b7280",
  },
  editButton: {
    width: 40,
    height: 40,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  profileCard: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "600",
    color: "#ffffff",
  },
  changePhotoButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#e0f2fe",
    borderRadius: 6,
  },
  changePhotoText: {
    fontSize: 12,
    color: "#3b82f6",
    fontWeight: "500",
  },
  profileInfo: {
    width: "100%",
    alignItems: "center",
  },
  userName: {
    fontSize: 20,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 2,
  },
  inputContainer: {
    width: "100%",
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: "#374151",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  saveButton: {
    backgroundColor: "#3b82f6",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 8,
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "500",
  },
  preferencesCard: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 16,
  },
  preferenceItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  preferenceText: {
    flex: 1,
  },
  preferenceTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 2,
  },
  preferenceSubtitle: {
    fontSize: 12,
    color: "#6b7280",
  },
  optionsCard: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  optionIcon: {
    width: 40,
    height: 40,
    backgroundColor: "#f8fafc",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 12,
    color: "#6b7280",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(220, 38, 38, 0.1)",
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  logoutButtonText: {
    fontSize: 16,
    color: "#dc2626",
    fontWeight: "500",
  },
})
