"use client"

import { useState, useEffect } from "react"
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, Alert, Dimensions } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"

import SafeAreaWrapper from "../components/SafeAreaWrapper"
import ResponsiveCard from "../components/ResponsiveCard"
import analyticsService from "../services/analyticsService"
import exportService from "../services/exportService"

const { width: screenWidth } = Dimensions.get("window")
const chartWidth = screenWidth - 40

export default function AdvancedReports({ navigation }) {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState(30)

  useEffect(() => {
    loadAnalytics()
  }, [selectedPeriod])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      const data = await analyticsService.generateWellnessAnalytics(selectedPeriod)
      setAnalytics(data)
    } catch (error) {
      console.error("Error loading analytics:", error)
      Alert.alert("Error", "Failed to load analytics data")
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadAnalytics()
    setRefreshing(false)
  }

  const handleExport = async (format) => {
    try {
      Alert.alert("Export Data", `Export your wellness data as ${format}?`, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Export",
          onPress: async () => {
            let result
            switch (format) {
              case "PDF":
                result = await exportService.exportAsPDF()
                break
              case "CSV":
                result = await exportService.exportAsCSV()
                break
              case "JSON":
                result = await exportService.exportAsJSON()
                break
            }

            if (result.success) {
              Alert.alert("Export Successful", `Your data has been exported as ${result.fileName}`, [
                { text: "OK" },
                {
                  text: "Share",
                  onPress: () => exportService.shareFile(result.fileUri, result.format),
                },
              ])
            } else {
              Alert.alert("Export Failed", result.error)
            }
          },
        },
      ])
    } catch (error) {
      console.error("Export error:", error)
      Alert.alert("Error", "Failed to export data")
    }
  }

  const getTrendColor = (trend) => {
    switch (trend) {
      case "improving":
        return "#10b981"
      case "declining":
        return "#ef4444"
      default:
        return "#6b7280"
    }
  }

  const getTrendIcon = (trend) => {
    switch (trend) {
      case "improving":
        return "trending-up"
      case "declining":
        return "trending-down"
      default:
        return "remove"
    }
  }

  const periods = [
    { label: "7 Days", value: 7 },
    { label: "30 Days", value: 30 },
    { label: "90 Days", value: 90 },
  ]

  if (loading && !analytics) {
    return (
      <SafeAreaWrapper backgroundColor="#f0f9ff">
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Generating analytics...</Text>
        </View>
      </SafeAreaWrapper>
    )
  }

  return (
    <SafeAreaWrapper backgroundColor="#f0f9ff" statusBarStyle="dark-content">
      <LinearGradient colors={["#f0f9ff", "#e0f2fe"]} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={20} color="#64748b" />
            </TouchableOpacity>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Advanced Reports</Text>
              <Text style={styles.headerSubtitle}>Detailed wellness analytics</Text>
            </View>
            <TouchableOpacity
              style={styles.exportButton}
              onPress={() => {
                Alert.alert("Export Options", "Choose export format:", [
                  { text: "Cancel", style: "cancel" },
                  { text: "PDF Report", onPress: () => handleExport("PDF") },
                  { text: "CSV Data", onPress: () => handleExport("CSV") },
                  { text: "JSON Data", onPress: () => handleExport("JSON") },
                ])
              }}
            >
              <Ionicons name="download-outline" size={20} color="#3b82f6" />
            </TouchableOpacity>
          </View>

          {/* Period Selector */}
          <View style={styles.periodSelector}>
            {periods.map((period) => (
              <TouchableOpacity
                key={period.value}
                style={[styles.periodButton, selectedPeriod === period.value && styles.periodButtonActive]}
                onPress={() => setSelectedPeriod(period.value)}
              >
                <Text
                  style={[styles.periodButtonText, selectedPeriod === period.value && styles.periodButtonTextActive]}
                >
                  {period.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />}
        >
          {/* Overview Stats */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Overview</Text>
            <View style={styles.statsGrid}>
              <ResponsiveCard style={styles.statCard}>
                <Text style={styles.statValue}>{analytics?.overview.avgWellnessScore || 0}</Text>
                <Text style={styles.statLabel}>Avg Wellness</Text>
              </ResponsiveCard>
              <ResponsiveCard style={styles.statCard}>
                <Text style={styles.statValue}>{analytics?.overview.avgMoodScore || 0}</Text>
                <Text style={styles.statLabel}>Avg Mood</Text>
              </ResponsiveCard>
              <ResponsiveCard style={styles.statCard}>
                <Text style={styles.statValue}>{analytics?.overview.avgSleepHours || 0}h</Text>
                <Text style={styles.statLabel}>Avg Sleep</Text>
              </ResponsiveCard>
              <ResponsiveCard style={styles.statCard}>
                <Text style={styles.statValue}>{analytics?.overview.currentStreak || 0}</Text>
                <Text style={styles.statLabel}>Day Streak</Text>
              </ResponsiveCard>
            </View>
          </View>

          {/* Trends */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Trends</Text>
            <ResponsiveCard style={styles.trendsCard}>
              <View style={styles.trendItem}>
                <View style={styles.trendInfo}>
                  <Text style={styles.trendLabel}>Wellness</Text>
                  <Text style={[styles.trendValue, { color: getTrendColor(analytics?.trends.wellnessTrend) }]}>
                    {analytics?.trends.wellnessTrend || "stable"}
                  </Text>
                </View>
                <Ionicons
                  name={getTrendIcon(analytics?.trends.wellnessTrend)}
                  size={20}
                  color={getTrendColor(analytics?.trends.wellnessTrend)}
                />
              </View>

              <View style={styles.trendItem}>
                <View style={styles.trendInfo}>
                  <Text style={styles.trendLabel}>Mood</Text>
                  <Text style={[styles.trendValue, { color: getTrendColor(analytics?.trends.moodTrend) }]}>
                    {analytics?.trends.moodTrend || "stable"}
                  </Text>
                </View>
                <Ionicons
                  name={getTrendIcon(analytics?.trends.moodTrend)}
                  size={20}
                  color={getTrendColor(analytics?.trends.moodTrend)}
                />
              </View>

              <View style={styles.trendItem}>
                <View style={styles.trendInfo}>
                  <Text style={styles.trendLabel}>Sleep</Text>
                  <Text style={[styles.trendValue, { color: getTrendColor(analytics?.trends.sleepTrend) }]}>
                    {analytics?.trends.sleepTrend || "stable"}
                  </Text>
                </View>
                <Ionicons
                  name={getTrendIcon(analytics?.trends.sleepTrend)}
                  size={20}
                  color={getTrendColor(analytics?.trends.sleepTrend)}
                />
              </View>
            </ResponsiveCard>
          </View>

          {/* Data Completeness */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Completeness</Text>
            <ResponsiveCard style={styles.completenessCard}>
              <View style={styles.completenessItem}>
                <Text style={styles.completenessLabel}>Overall</Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${analytics?.dataCompleteness.overall || 0}%` }]} />
                </View>
                <Text style={styles.completenessValue}>{analytics?.dataCompleteness.overall || 0}%</Text>
              </View>

              <View style={styles.completenessItem}>
                <Text style={styles.completenessLabel}>Wellness</Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${analytics?.dataCompleteness.wellness || 0}%` }]} />
                </View>
                <Text style={styles.completenessValue}>{analytics?.dataCompleteness.wellness || 0}%</Text>
              </View>

              <View style={styles.completenessItem}>
                <Text style={styles.completenessLabel}>Journal</Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${analytics?.dataCompleteness.journal || 0}%` }]} />
                </View>
                <Text style={styles.completenessValue}>{analytics?.dataCompleteness.journal || 0}%</Text>
              </View>

              <View style={styles.completenessItem}>
                <Text style={styles.completenessLabel}>Usage</Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${analytics?.dataCompleteness.usage || 0}%` }]} />
                </View>
                <Text style={styles.completenessValue}>{analytics?.dataCompleteness.usage || 0}%</Text>
              </View>
            </ResponsiveCard>
          </View>

          {/* Insights */}
          {analytics?.insights && analytics.insights.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Key Insights</Text>
              {analytics.insights.map((insight, index) => (
                <ResponsiveCard key={index} style={styles.insightCard}>
                  <View style={styles.insightHeader}>
                    <Ionicons name={insight.icon || "bulb"} size={20} color={insight.color || "#3b82f6"} />
                    <Text style={styles.insightTitle}>{insight.title}</Text>
                  </View>
                  <Text style={styles.insightMessage}>{insight.message}</Text>
                </ResponsiveCard>
              ))}
            </View>
          )}

          {/* Recommendations */}
          {analytics?.recommendations && analytics.recommendations.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recommendations</Text>
              <ResponsiveCard style={styles.recommendationsCard}>
                {analytics.recommendations.map((recommendation, index) => (
                  <View key={index} style={styles.recommendationItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                    <Text style={styles.recommendationText}>{recommendation}</Text>
                  </View>
                ))}
              </ResponsiveCard>
            </View>
          )}

          {/* Patterns */}
          {analytics?.patterns && analytics.patterns.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Patterns Detected</Text>
              {analytics.patterns.map((pattern, index) => (
                <ResponsiveCard key={index} style={styles.patternCard}>
                  <Text style={styles.patternTitle}>{pattern.title}</Text>
                  <Text style={styles.patternMessage}>{pattern.message}</Text>
                </ResponsiveCard>
              ))}
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      </LinearGradient>
    </SafeAreaWrapper>
  )
}

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
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#374151",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6b7280",
  },
  exportButton: {
    width: 40,
    height: 40,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  periodSelector: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 8,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  periodButtonActive: {
    backgroundColor: "#3b82f6",
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
  },
  periodButtonTextActive: {
    color: "#ffffff",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    padding: 16,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#059669",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },
  trendsCard: {
    padding: 16,
  },
  trendItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  trendInfo: {
    flex: 1,
  },
  trendLabel: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 2,
  },
  trendValue: {
    fontSize: 16,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  completenessCard: {
    padding: 16,
  },
  completenessItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  completenessLabel: {
    fontSize: 14,
    color: "#374151",
    width: 80,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: "#e5e7eb",
    borderRadius: 4,
    marginHorizontal: 12,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#10b981",
    borderRadius: 4,
  },
  completenessValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    width: 40,
    textAlign: "right",
  },
  insightCard: {
    padding: 16,
    marginBottom: 12,
  },
  insightHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  insightMessage: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
  },
  recommendationsCard: {
    padding: 16,
  },
  recommendationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 12,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
  patternCard: {
    padding: 16,
    marginBottom: 12,
  },
  patternTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  patternMessage: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
  },
})
