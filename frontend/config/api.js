import axios from "axios"
import { Platform } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { LOCAL_IP } from "@env"

// For local development - IP from environment variable
const localIP = LOCAL_IP 
const API_BASE_URL = Platform.OS === "ios" ? `http://localhost:3000/api/v1` : `http://${localIP}:3000/api/v1`

// For production - Replace with your actual API URL
const PRODUCTION_API_URL = "https://your-production-domain.com/api/v1"

// Use production URL if available, otherwise use local
const baseURL = __DEV__ ? API_BASE_URL : PRODUCTION_API_URL
console.log("Base API URL:", baseURL)

// Create axios instance
const api = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("authToken")
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    } catch (error) {
      console.error("Error getting auth token:", error)
    }
    return config
  },
  (error) => {
    console.error("API Request Error:", error)
    return Promise.reject(error)
  },
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (__DEV__) {
      console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url}:`, response.status)
    }
    return response
  },
  async (error) => {
    if (__DEV__) {
      console.log(
        `❌ ${error.config?.method?.toUpperCase()} ${error.config?.url}:`,
        error.response?.status || "Network Error",
      )
    }

    if (error.code === "ECONNABORTED") {
      console.error("API Timeout Error")
    } else if (error.response?.status === 401) {
      console.error("Authentication Error - Token may be expired")
      // We no longer automatically clear storage here. The authService will handle this.
    } else if (error.response?.status === 403) {
      console.error("Authorization Error - Insufficient permissions")
    } else if (error.response?.status >= 500) {
      console.error("Server Error:", error.response.status)
    } else if (error.response?.status === 404) {
      console.error("Resource not found:", error.config?.url)
    } else if (!error.response) {
      console.error("Network Error - Check your connection")
    } else {
      console.error("API Error:", error.response?.data || error.message)
    }

    return Promise.reject(error)
  },
)

export default api
export { baseURL }
