"use client"

import { useState, useEffect } from "react"
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, Alert, Dimensions } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import SafeAreaWrapper from "../components/SafeAreaWrapper"
import ResponsiveCard from "../components/ResponsiveCard"
import ResponsiveGrid from "../components/ResponsiveGrid"
import authService from "../services/authService"
import localStorageService from "../services/localStorageService"
import onDeviceAIService from "../services/onDeviceAIService"
import behavioralTrackingService from "../services/behavioralTrackingService"

const { width: screenWidth } = Dimensions.get("window")
const isTablet = screenWidth > 768

export default function Dashboard({ navigation }) {
  const insets = useSafeAreaInsets()
  const [user, setUser] = useState(null)
  const [dashboardData, setDashboardData] = useState({
    wellnessScore: 0,
    recentEntries: [],
    todayStats: {
      sleep: "Not tracked",
      screenTime: "Not tracked",
      mood: "Not tracked",
      pickups: 0,
    },
    insights: [],
  })
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    initializeDashboard()
  }, [])

  const initializeDashboard = async () => {
    try {
      const currentUser = authService.getCurrentUser()
      setUser(currentUser)

      await Promise.all([
        localStorageService.initialize(),
        onDeviceAIService.initialize(),
      ])

      // Initialize behavioral tracking
      await behavioralTrackingService.initializeTracking()

      await loadDashboardData()
    } catch (error) {
      console.error("Dashboard initialization error:", error)
      Alert.alert("Error", "Failed to initialize dashboard. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const loadDashboardData = async () => {
    try {
      const [journalEntries, wellnessData, usageStats] = await Promise.all([
        localStorageService.getJournalEntries(3),
        localStorageService.getWellnessData(7),
        behavioralTrackingService.getDailyUsageStats()
      ])

      const todayData = wellnessData[0]

      const insights = onDeviceAIService.generateWellnessInsights(wellnessData)

      setDashboardData({
        wellnessScore: todayData?.wellnessScore || 0,
        recentEntries: journalEntries,
        todayStats: {
          sleep: todayData?.sleepHours
            ? `${Math.floor(todayData.sleepHours)}h ${Math.round((todayData.sleepHours % 1) * 60)}m`
            : "Not tracked", // Placeholder sleep tracking
          screenTime: usageStats?.screenTimeMinutes
            ? `${Math.floor(usageStats.screenTimeMinutes / 60)}h ${usageStats.screenTimeMinutes % 60}m`
            : "Not tracked",
          mood: todayData?.moodLabel ? capitalize(todayData.moodLabel) : "Not tracked",
          pickups: usageStats?.pickupCount || 0,
        },
        insights,
      })
    } catch (error) {
      console.error("Dashboard data loading error:", error)
      Alert.alert("Error", "Failed to load dashboard data.")
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadDashboardData()
    setRefreshing(false)
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    return (hour < 12) ? "Good morning" : (hour < 17) ? "Good afternoon" : "Good evening"
  }

  const getWellnessColor = (score) => {
    if (score >= 80) return "#10b981"
    if (score >= 60) return "#f59e0b"
    return "#ef4444"
  }

  const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1)


  const handleQuickMoodLog = async (moodLabel) => {
    try {
      const today = new Date().toISOString().split("T")[0]

      const metrics = {
        sleepHours: 7, 
        moodLabel,
        screenTimeMinutes: 180, 
        activityMinutes: 30, 
      }

      const wellnessScore = onDeviceAIService.calculateWellnessScore(metrics)

      await localStorageService.saveWellnessData(today, {
        ...metrics,
        wellnessScore,
      })

      await loadDashboardData()
      Alert.alert("Mood Logged", `Your mood has been recorded. Wellness score: ${wellnessScore}`)
    } catch (error) {
      console.error("Error logging mood:", error)
      Alert.alert("Error", "Failed to log mood")
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

  const moodOptions = [
    { emoji: "😊", label: "Positive", color: "#10b981" },
    { emoji: "😐", label: "Neutral", color: "#6b7280" },
    { emoji: "😔", label: "Negative", color: "#ef4444" },
  ];

  const quickActions = [
    {
      icon: "book-outline",
      title: "Daily Journal",
      subtitle: "Express your thoughts",
      color: "#3b82f6",
      onPress: () => navigation.navigate("Journal"),
    },
    {
      icon: "people-outline",
      title: "Community",
      subtitle: "Connect with others",
      color: "#8b5cf6",
      onPress: () => navigation.navigate("Community"),
    },
    {
      icon: "bar-chart-outline",
      title: "Wellness Report",
      subtitle: "View your progress",
      color: "#10b981",
      onPress: () => navigation.navigate("Reports"),
    },
    {
      icon: "analytics-outline",
      title: "Usage Tracking",
      subtitle: "Digital wellbeing",
      color: "#f59e0b",
      onPress: () => navigation.navigate("Track"),
    },
  ]

  if (loading) {
    return (
      <SafeAreaWrapper backgroundColor="#dbeafe">
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your dashboard...</Text>
        </View>
      </SafeAreaWrapper>
    )
  }

  return (
    <SafeAreaWrapper backgroundColor="#dbeafe" statusBarStyle="dark-content">
      <LinearGradient colors={["#dbeafe", "#d1fae5"]} style={styles.gradient}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 100, 120) }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />}
        >
          {/* Header */}
          <View style={[styles.header, { paddingTop: 10 }]}>
            <View style={styles.headerContent}>
              <View style={styles.headerText}>
                <Text style={styles.greeting}>
                  {getGreeting()}, {user.username || "User"}
                </Text>
                <Text style={styles.subtitle}>How are you feeling today?</Text>
              </View>
              <View style={styles.headerIcons}>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => navigation.navigate("Settings")}
                  activeOpacity={0.7}
                >
                  <Ionicons name="settings-outline" size={20} color="#64748b" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton} onPress={handleLogout} activeOpacity={0.7}>
                  <Ionicons name="log-out-outline" size={20} color="#64748b" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Wellness Score */}
            <ResponsiveCard style={styles.wellnessCard}>
              <View style={styles.wellnessHeader}>
                <Text style={styles.wellnessTitle}>Today's Wellness Score</Text>
                <View
                  style={[styles.wellnessScore, { backgroundColor: getWellnessColor(dashboardData.wellnessScore) }]}
                >
                  <Text style={styles.wellnessScoreText}>{dashboardData.wellnessScore}</Text>
                </View>
              </View>
              <Text style={styles.wellnessSubtitle}>Based on sleep, mood, activity, and screen time</Text>
            </ResponsiveCard>

            {/* Insights */}
            {dashboardData.insights.length > 0 && (
              <ResponsiveCard backgroundColor="rgba(59, 130, 246, 0.1)" style={styles.insightCard}>
                <View style={styles.insightHeader}>
                  <Ionicons name="analytics" size={20} color="#3b82f6" />
                  <Text style={styles.insightTitle}>Wellness Insight</Text>
                </View>
                <Text style={styles.insightMessage}>{dashboardData.insights[0].message}</Text>
                <Text style={styles.insightRecommendation}>💡 {dashboardData.insights[0].recommendation}</Text>
              </ResponsiveCard>
            )}

            {/* Quick Mood Check */}
            <ResponsiveCard style={styles.moodCard}>
              <Text style={styles.moodTitle}>Quick mood check-in</Text>
              <View style={styles.moodOptions}>
                {moodOptions.map((mood, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.moodOption}
                    onPress={() => handleQuickMoodLog(mood.label)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                    <Text style={styles.moodLabel}>{mood.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ResponsiveCard>
          </View>

          {/* Main Content */}
          <View style={styles.content}>
            {/* Today's Highlights */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Today's Highlights</Text>
              <ResponsiveGrid columns={2} spacing={12}>
                <ResponsiveCard style={styles.highlightCard}>
                  <View style={[styles.highlightIcon, { backgroundColor: "#e0e7ff" }]}>
                    <Ionicons name="moon" size={20} color="#6366f1" />
                  </View>
                  <Text style={styles.highlightValue}>{dashboardData.todayStats.sleep}</Text>
                  <Text style={styles.highlightLabel}>Sleep</Text>
                </ResponsiveCard>

                <ResponsiveCard style={styles.highlightCard}>
                  <View style={[styles.highlightIcon, { backgroundColor: "#d1fae5" }]}>
                    <Ionicons name="phone-portrait" size={20} color="#10b981" />
                  </View>
                  <Text style={styles.highlightValue}>{dashboardData.todayStats.screenTime}</Text>
                  <Text style={styles.highlightLabel}>Screen time</Text>
                </ResponsiveCard>

                <ResponsiveCard style={styles.highlightCard}>
                  <View style={[styles.highlightIcon, { backgroundColor: "#fef3c7" }]}>
                    <Ionicons name="happy" size={20} color="#f59e0b" />
                  </View>
                  <Text style={styles.highlightValue}>{dashboardData.todayStats.mood}</Text>
                  <Text style={styles.highlightLabel}>Mood</Text>
                </ResponsiveCard>

                <ResponsiveCard style={styles.highlightCard}>
                  <View style={[styles.highlightIcon, { backgroundColor: "#ede9fe" }]}>
                    <Ionicons name="refresh" size={20} color="#8b5cf6" />
                  </View>
                  <Text style={styles.highlightValue}>{dashboardData.todayStats.pickups}</Text>
                  <Text style={styles.highlightLabel}>Pickups</Text>
                </ResponsiveCard>
              </ResponsiveGrid>
            </View>

            {/* Recent Journal Entries */}
            {dashboardData.recentEntries.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Recent Entries</Text>
                  <TouchableOpacity onPress={() => navigation.navigate("Journal")}>
                    <Text style={styles.seeAllText}>See All</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.journalPreview}>
                  {dashboardData.recentEntries.slice(0, 2).map((entry) => (
                    <ResponsiveCard key={entry.id} style={styles.journalPreviewItem}>
                      <View style={styles.journalPreviewHeader}>
                        <Text style={styles.journalPreviewDate}>{new Date(entry.timestamp).toLocaleDateString()}</Text>
                        {entry.mood_label && (
                          <View style={[styles.moodBadge, { backgroundColor: getMoodColor(entry.mood_label) }]}>
                            <Text style={styles.moodBadgeText}>{capitalize(entry.mood_label)}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.journalPreviewText} numberOfLines={2}>
                        {entry.content}
                      </Text>
                    </ResponsiveCard>
                  ))}
                </View>
              </View>
            )}

            {/* Quick Actions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.actionsGrid}>
                {quickActions.map((action, index) => (
                  <TouchableOpacity key={index} onPress={action.onPress} activeOpacity={0.7}>
                    <ResponsiveCard style={styles.actionCard}>
                      <View style={styles.actionContent}>
                        <View style={[styles.actionIcon, { backgroundColor: `${action.color}20` }]}>
                          <Ionicons name={action.icon} size={24} color={action.color} />
                        </View>
                        <View style={styles.actionText}>
                          <Text style={styles.actionTitle}>{action.title}</Text>
                          <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={action.color} />
                      </View>
                    </ResponsiveCard>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Emergency Support */}
            <TouchableOpacity onPress={() => navigation.navigate("Emergency")} activeOpacity={0.7}>
              <ResponsiveCard backgroundColor="rgba(254, 242, 242, 0.9)" style={styles.emergencyCard}>
                <View style={styles.emergencyContent}>
                  <View style={styles.emergencyIcon}>
                    <Ionicons name="alert-circle" size={20} color="#dc2626" />
                  </View>
                  <View style={styles.emergencyText}>
                    <Text style={styles.emergencyTitle}>Need immediate support?</Text>
                    <Text style={styles.emergencySubtitle}>Crisis resources available 24/7</Text>
                  </View>
                  <View style={styles.emergencyButton}>
                    <Text style={styles.emergencyButtonText}>Help</Text>
                  </View>
                </View>
              </ResponsiveCard>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaWrapper>
  )
}

const getMoodColor = (label) => {
  if (label === 'positive') return "#d1fae5";
  if (label === 'neutral') return "#fef3c7";
  return "#fecaca"; // For negative
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#6b7280",
    marginTop: 16,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  headerText: {
    flex: 1,
  },
  greeting: {
    fontSize: isTablet ? 28 : 24,
    fontWeight: "300",
    color: "#374151",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: isTablet ? 18 : 16,
    color: "#6b7280",
  },
  headerIcons: {
    flexDirection: "row",
    gap: 12,
  },
  iconButton: {
    width: 44,
    height: 44,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  wellnessCard: {
    marginBottom: 16,
  },
  wellnessHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  wellnessTitle: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: "600",
    color: "#374151",
  },
  wellnessScore: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  wellnessScoreText: {
    fontSize: isTablet ? 22 : 20,
    fontWeight: "700",
    color: "#ffffff",
  },
  wellnessSubtitle: {
    fontSize: isTablet ? 16 : 14,
    color: "#6b7280",
  },
  insightCard: {
    marginBottom: 16,
  },
  insightHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  insightTitle: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: "600",
    color: "#1e40af",
  },
  insightMessage: {
    fontSize: isTablet ? 16 : 14,
    color: "#1e40af",
    marginBottom: 8,
    lineHeight: 20,
  },
  insightRecommendation: {
    fontSize: isTablet ? 15 : 13,
    color: "#3730a3",
    fontStyle: "italic",
  },
  moodCard: {
    marginBottom: 16,
  },
  moodTitle: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 16,
  },
  moodOptions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  moodOption: {
    flex: 1,
    alignItems: "center",
    padding: isTablet ? 16 : 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
  },
  moodEmoji: {
    fontSize: isTablet ? 32 : 28,
    marginBottom: 6,
  },
  moodLabel: {
    fontSize: isTablet ? 14 : 12,
    fontWeight: "600",
    color: "#64748b",
  },
  content: {
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: isTablet ? 22 : 20,
    fontWeight: "600",
    color: "#374151",
  },
  seeAllText: {
    fontSize: isTablet ? 16 : 14,
    color: "#059669",
    fontWeight: "600",
  },
  highlightCard: {
    alignItems: "center",
    padding: isTablet ? 20 : 16,
  },
  highlightIcon: {
    width: isTablet ? 48 : 40,
    height: isTablet ? 48 : 40,
    borderRadius: isTablet ? 24 : 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  highlightValue: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },
  highlightLabel: {
    fontSize: isTablet ? 14 : 12,
    color: "#6b7280",
    fontWeight: "500",
  },
  journalPreview: {
    gap: 16,
  },
  journalPreviewItem: {
    padding: 16,
  },
  journalPreviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  journalPreviewDate: {
    fontSize: isTablet ? 14 : 12,
    color: "#6b7280",
    fontWeight: "500",
  },
  moodBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  moodBadgeText: {
    fontSize: isTablet ? 12 : 10,
    fontWeight: "600",
    color: "#374151",
  },
  journalPreviewText: {
    fontSize: isTablet ? 16 : 14,
    color: "#374151",
    lineHeight: isTablet ? 24 : 20,
  },
  actionsGrid: {
    gap: 12,
  },
  actionCard: {
    padding: 16,
  },
  actionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  actionIcon: {
    width: isTablet ? 56 : 48,
    height: isTablet ? 56 : 48,
    borderRadius: isTablet ? 28 : 24,
    justifyContent: "center",
    alignItems: "center",
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: isTablet ? 16 : 14,
    color: "#6b7280",
  },
  emergencyCard: {
    padding: 16,
  },
  emergencyContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  emergencyIcon: {
    width: isTablet ? 48 : 40,
    height: isTablet ? 48 : 40,
    backgroundColor: "#fecaca",
    borderRadius: isTablet ? 24 : 20,
    justifyContent: "center",
    alignItems: "center",
  },
  emergencyText: {
    flex: 1,
  },
  emergencyTitle: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },
  emergencySubtitle: {
    fontSize: isTablet ? 16 : 14,
    color: "#6b7280",
  },
  emergencyButton: {
    backgroundColor: "#dc2626",
    paddingHorizontal: isTablet ? 20 : 16,
    paddingVertical: isTablet ? 12 : 10,
    borderRadius: 8,
  },
  emergencyButtonText: {
    color: "#ffffff",
    fontSize: isTablet ? 16 : 14,
    fontWeight: "600",
  },
})