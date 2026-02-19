"use client"

import 'react-native-get-random-values'; 
import { useState, useEffect } from "react"
import { NavigationContainer } from "@react-navigation/native"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { createStackNavigator } from "@react-navigation/stack"
import { StatusBar } from "expo-status-bar"
import { View, ActivityIndicator, Text, AppState } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { SafeAreaProvider } from "react-native-safe-area-context"

// Import screens
import Dashboard from "./screens/Dashboard"
import Journal from "./screens/Journal"
import Tracker from "./screens/Tracker"
import Community from "./screens/Community"
import Emergency from "./screens/Emergency"
import Reports from "./screens/Reports"
import AdvancedReports from "./screens/AdvancedReports"
import NotificationSettings from "./screens/NotificationSettings"
import LoginScreen from "./screens/auth/LoginScreen"
import RegisterScreen from "./screens/auth/RegisterScreen"
import WelcomeScreen from "./screens/auth/WelcomeScreen"
import ProfileScreen from "./screens/ProfileScreen"
import SettingsScreen from "./screens/SettingsScreen"
import HelpDirectoryScreen from "./screens/HelpDirectoryScreen"
import PrivacySettingsScreen from "./screens/PrivacySettingsScreen"
import ChangePasswordScreen from "./screens/ChangePasswordScreen"
import ForgotPasswordScreen from "./screens/ForgotPasswordScreen"

// Import services
import authService from "./services/authService"
import behavioralTrackingService from "./services/behavioralTrackingService"
import notificationService from "./services/notificationService"
import localStorageService from './services/localStorageService';
import journalService from './services/journalService';

const Tab = createBottomTabNavigator()
const Stack = createStackNavigator()
const AuthStack = createStackNavigator()

function LoadingScreen() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f8fafc",
      }}
    >
      <ActivityIndicator size="large" color="#059669" />
      <Text
        style={{
          marginTop: 16,
          fontSize: 16,
          color: "#6b7280",
          fontWeight: "500",
        }}
      >
        Loading...
      </Text>
    </View>
  )
}

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName

          if (route.name === "Home") {
            iconName = focused ? "heart" : "heart-outline"
          } else if (route.name === "Journal") {
            iconName = focused ? "book" : "book-outline"
          } else if (route.name === "Track") {
            iconName = focused ? "analytics" : "analytics-outline"
          } else if (route.name === "Support") {
            iconName = focused ? "people" : "people-outline"
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline"
          }

          return <Ionicons name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: "#059669",
        tabBarInactiveTintColor: "#94a3b8",
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopColor: "#e2e8f0",
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={Dashboard} />
      <Tab.Screen name="Journal" component={Journal} />
      <Tab.Screen name="Track" component={Tracker} />
      <Tab.Screen name="Support" component={Emergency} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  )
}

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  )
}

function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={TabNavigator} />
      <Stack.Screen name="Emergency" component={Emergency} />
      <Stack.Screen name="Community" component={Community} />
      <Stack.Screen name="Reports" component={Reports} />
      <Stack.Screen name="AdvancedReports" component={AdvancedReports} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettings} />
      <Stack.Screen name="HelpDirectory" component={HelpDirectoryScreen} />
      <Stack.Screen name="PrivacySettings" component={PrivacySettingsScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
    </Stack.Navigator>
  )
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    initializeApp()

    // Listen for auth state changes
    const authStateListener = (authenticated) => {
      setIsAuthenticated(authenticated)
    }

    authService.addAuthStateListener(authStateListener)

    // Handle app state changes
    let lastAppState = "active"
    const handleAppStateChange = async (nextAppState) => {
      if (nextAppState === "active" && lastAppState !== "active") {
        // App foregrounded — finalize yesterday's journal if the date has rolled over.
        // This is the correct place for finalization: explicit, not buried in getJournal().
        try {
          const today = new Date().toISOString().split("T")[0]
          const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0]
          await journalService.finalizeYesterdayIfNeeded(yesterday, today)
        } catch (e) {
          console.warn("Journal finalization on foreground failed:", e)
        }
      }
      lastAppState = nextAppState
    }

    const appStateSubscription = AppState.addEventListener("change", handleAppStateChange)

    // Cleanup listeners on unmount
    return () => {
      authService.removeAuthStateListener(authStateListener)
      appStateSubscription?.remove()
    }
  }, [])

  const initializeApp = async () => {
    try {
      await localStorageService.initialize();
      const authInitialized = await authService.initializeAuth()
      setIsAuthenticated(authInitialized)

      // Initialize behavioral tracking if user is authenticated
      if (authInitialized) {
        await behavioralTrackingService.initializeTracking()
        // Initialize notification service
        await notificationService.initialize()
      }
    } catch (error) {
      console.error("App initialization error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <NavigationContainer>{isAuthenticated ? <MainNavigator /> : <AuthNavigator />}</NavigationContainer>
    </SafeAreaProvider>
  )
}