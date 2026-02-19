import AsyncStorage from "@react-native-async-storage/async-storage"
import * as SecureStore from "expo-secure-store"
import api from "../config/api"

// Auth token lives in SecureStore (hardware-backed, not readable on rooted devices).
// User profile data (non-credential) stays in AsyncStorage — it's not sensitive.
const AUTH_TOKEN_KEY = "authToken"

class AuthService {
  constructor() {
    this.user = null
    this.isInitialized = false
    this.authStateListeners = []
  }

  // Add listener for auth state changes
  addAuthStateListener(listener) {
    this.authStateListeners.push(listener)
  }

  // Remove listener
  removeAuthStateListener(listener) {
    this.authStateListeners = this.authStateListeners.filter((l) => l !== listener)
  }

  // Notify all listeners of auth state change
  notifyAuthStateChange(isAuthenticated) {
    this.authStateListeners.forEach((listener) => listener(isAuthenticated))
  }

  // Initialize auth state from storage
  async initializeAuth() {
    try {
      // authToken is in SecureStore; userData is in AsyncStorage
      const [token, userDataRaw] = await Promise.all([
        SecureStore.getItemAsync(AUTH_TOKEN_KEY),
        AsyncStorage.getItem("userData"),
      ])

      if (token && userDataRaw) {
        this.user = JSON.parse(userDataRaw)
        this.isInitialized = true

        // Verify token is still valid against the server
        try {
          const response = await api.get("/auth/profile")
          this.user = response.data
          await AsyncStorage.setItem("userData", JSON.stringify(this.user))
          return true
        } catch (error) {
          // Token invalid or expired — clear everything
          await this.logout()
          return false
        }
      }

      this.isInitialized = true
      return false
    } catch (error) {
      console.error("Auth initialization error:", error)
      this.isInitialized = true
      return false
    }
  }

  // Register user
  async register(userData) {
    try {
      const response = await api.post("/auth/register", userData)

      console.log("Register response:", response.data)

      return { success: true, message: response.data.message }
    } catch (error) {
      console.error("Registration error:", error)
      if (error.response && error.response.data) {
        return { success: false, message: error.response.data.message }
      }
      return { success: false, message: "Registration failed. Please try again." }
    }
  }

  // Login user
  async login(email, password) {
    try {
      // Step 1: Log in and get the token
      const response = await api.post("/auth/login", { email, password })

      console.log("Login response:", response.data)

      const { token } = response.data

      if (!token) {
        throw new Error("No authentication token received")
      }

      // Step 2: Save the token in SecureStore (hardware-backed storage)
      await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token)

      // Step 3: Fetch the full user profile with the token
      const profileResponse = await api.get("/auth/profile")

      // Step 4: Construct the complete user object and save it
      const user = {
        ...profileResponse.data,
        email, // Add email from the login form
      }

      await AsyncStorage.setItem("userData", JSON.stringify(user))

      // Update in-memory state
      this.user = user
      this.notifyAuthStateChange(true)

      return { success: true, user }
    } catch (error) {
      console.error("Login error:", error)

      if (error.response && error.response.data) {
        // If login fails, clear any potentially invalid tokens to prevent subsequent 401s
        if (error.response.status === 401) {
          await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY)
        }
        return { success: false, message: error.response.data.message }
      }

      return { success: false, message: "Login failed. Please try again." }
    }
  }

  // New: Forgot password
  async forgotPassword(email) {
    try {
      const response = await api.post("/auth/forgotpassword", { email })
      return { success: true, message: response.data.data }
    } catch (error) {
      console.error("Forgot password error:", error)
      return {
        success: false,
        message: error.response?.data?.message || "Failed to send reset email.",
      }
    }
  }

  // New: Change password
  async changePassword(oldPassword, newPassword) {
    try {
      const response = await api.post("/auth/changepassword", { oldPassword, newPassword })
      return { success: true, message: response.data.message }
    } catch (error) {
      console.error("Change password error:", error)
      return {
        success: false,
        message: error.response?.data?.message || "Failed to change password.",
      }
    }
  }

  // Logout user
  async logout() {
    try {
      await api.post("/auth/logout")
      // Clear token from SecureStore and profile from AsyncStorage
      await Promise.all([
        SecureStore.deleteItemAsync(AUTH_TOKEN_KEY),
        AsyncStorage.removeItem("userData"),
      ])

      this.user = null

      // Notify listeners of auth state change
      this.notifyAuthStateChange(false)

      return true
    } catch (error) {
      console.error("Logout error:", error)
      return false
    }
  }

  // Update consent preferences
  async updateConsent(consentFlags) {
    try {
      const response = await api.put("/auth/consent", consentFlags)
      this.user = { ...this.user, consentFlags: response.data.data }
      await AsyncStorage.setItem("userData", JSON.stringify(this.user))
      return { success: true, user: this.user }
    } catch (error) {
      console.error("Consent update error:", error)
      return {
        success: false,
        message: error.response?.data?.message || "Failed to update consent preferences.",
      }
    }
  }

  // Update user profile data
  async updateProfile(profileData) {
    try {
      const response = await api.put("/auth/profile", profileData)
      this.user = { ...this.user, username: response.data.username }
      await AsyncStorage.setItem("userData", JSON.stringify(this.user))
      return { success: true, user: this.user }
    } catch (error) {
      console.error("Profile update error:", error)
      return {
        success: false,
        message: error.response?.data?.message || "Failed to update profile.",
      }
    }
  }

  // Export user data
  async exportUserData() {
    try {
      const response = await api.get("/auth/export")
      return { success: true, data: response.data }
    } catch (error) {
      console.error("Export data error:", error)
      return {
        success: false,
        message: error.response?.data?.message || "Failed to export data.",
      }
    }
  }

  // Clear user data
  async clearUserData() {
    try {
      await api.post("/user/clear-data")
      return { success: true }
    } catch (error) {
      console.error("Clear data error:", error)
      return {
        success: false,
        message: error.response?.data?.message || "Failed to clear data.",
      }
    }
  }

  // Delete user account
  async deleteAccount(password) {
    try {
      await api.post("/auth/delete", { password })
      await this.logout()
      return { success: true }
    } catch (error) {
      console.error("Delete account error:", error)
      return {
        success: false,
        message: error.response?.data?.message || "Failed to delete account.",
      }
    }
  }

  // Save push token
  async savePushToken(token) {
    try {
      await api.post("/auth/push-token", { token })
      return { success: true }
    } catch (error) {
      console.error("Save push token error:", error)
      return { success: false }
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.user && this.isInitialized
  }

  // Get current user
  getCurrentUser() {
    return this.user
  }

  // Get user consent flags
  getConsentFlags() {
    return this.user?.consentFlags || {}
  }
}

export default new AuthService()