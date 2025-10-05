import { View, Text, ScrollView, TouchableOpacity, StyleSheet} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
import SafeAreaWrapper from "../components/SafeAreaWrapper"

export default function Reports({ navigation }) {
  const reportTypes = [
    {
      icon: "trending-up",
      title: "Weekly Summary",
      subtitle: "Your progress this week",
      color: "#10b981",
      bgColor: "#d1fae5",
    },
    {
      icon: "calendar",
      title: "Monthly Trends",
      subtitle: "Patterns from this month",
      color: "#8b5cf6",
      bgColor: "#ede9fe",
    },
  ]

  const weeklyMetrics = [
    { value: "7.2h", label: "Avg Sleep", change: "↑ 15min", changeColor: "#10b981", bgColor: "#dbeafe" },
    { value: "82%", label: "Mood Score", change: "↑ 8%", changeColor: "#10b981", bgColor: "#d1fae5" },
    { value: "5", label: "Journal Entries", change: "→ Same", changeColor: "#3b82f6", bgColor: "#ede9fe" },
    { value: "3.1h", label: "Screen Time", change: "↓ 20min", changeColor: "#10b981", bgColor: "#fef3c7" },
  ]

  const insights = [
    { title: "Sleep Quality Improving", subtitle: "Your bedtime routine is working", color: "#10b981" },
    { title: "Morning Positivity", subtitle: "Best mood times are in the morning", color: "#3b82f6" },
    { title: "Digital Balance", subtitle: "Less screen time = better sleep", color: "#8b5cf6" },
  ]

  const recommendations = ["Keep up your evening routine", "Try morning journaling", "Set phone-free bedtime"]

  return (
    <SafeAreaWrapper backgroundColor="#dbeafe" statusBarStyle="dark-content">
      <View style={styles.statusBarBg} />
      <LinearGradient colors={["#f1f5f9", "#dbeafe"]} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={20} color="#64748b" />
            </TouchableOpacity>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Wellness Insights</Text>
              <Text style={styles.headerSubtitle}>Your journey in numbers</Text>
            </View>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="share-outline" size={20} color="#64748b" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Report Types */}
          <View style={styles.section}>
            {reportTypes.map((report, index) => (
              <View key={index} style={styles.reportCard}>
                <View style={styles.reportContent}>
                  <View style={[styles.reportIcon, { backgroundColor: report.bgColor }]}>
                    <Ionicons name={report.icon} size={24} color={report.color} />
                  </View>
                  <View style={styles.reportText}>
                    <Text style={styles.reportTitle}>{report.title}</Text>
                    <Text style={styles.reportSubtitle}>{report.subtitle}</Text>
                  </View>
                  <TouchableOpacity style={[styles.viewButton, { borderColor: report.color }]}>
                    <Text style={[styles.viewButtonText, { color: report.color }]}>View</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          {/* Current Report */}
          <View style={styles.currentReportCard}>
            <View style={styles.currentReportHeader}>
              <Text style={styles.currentReportTitle}>Weekly Summary</Text>
              <TouchableOpacity>
                <Ionicons name="download-outline" size={20} color="#3b82f6" />
              </TouchableOpacity>
            </View>

            {/* Key Metrics */}
            <View style={styles.metricsGrid}>
              {weeklyMetrics.map((metric, index) => (
                <View key={index} style={[styles.metricCard, { backgroundColor: metric.bgColor }]}>
                  <Text style={styles.metricValue}>{metric.value}</Text>
                  <Text style={styles.metricLabel}>{metric.label}</Text>
                  <Text style={[styles.metricChange, { color: metric.changeColor }]}>{metric.change}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Insights */}
          <View style={styles.insightsCard}>
            <View style={styles.insightsHeader}>
              <Ionicons name="eye" size={20} color="#3b82f6" />
              <Text style={styles.insightsTitle}>Key Insights</Text>
            </View>
            <View style={styles.insightsList}>
              {insights.map((insight, index) => (
                <View key={index} style={styles.insightItem}>
                  <View style={[styles.insightDot, { backgroundColor: insight.color }]} />
                  <View style={styles.insightText}>
                    <Text style={styles.insightTitle}>{insight.title}</Text>
                    <Text style={styles.insightSubtitle}>{insight.subtitle}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Recommendations */}
          <View style={styles.recommendationsCard}>
            <Text style={styles.recommendationsTitle}>Recommendations</Text>
            <View style={styles.recommendationsList}>
              {recommendations.map((recommendation, index) => (
                <View key={index} style={styles.recommendationItem}>
                  <View
                    style={[styles.recommendationDot, { backgroundColor: ["#10b981", "#3b82f6", "#8b5cf6"][index] }]}
                  />
                  <Text style={styles.recommendationText}>{recommendation}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Fixed Bottom Action */}
        <View style={styles.bottomAction}>
          <TouchableOpacity style={styles.customReportButton}>
            <Text style={styles.customReportButtonText}>Create Custom Report</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </SafeAreaWrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statusBarBg: {
    height: 0,
    backgroundColor: "#f1f5f9",
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
    alignItems: "center",
    gap: 12,
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
    fontWeight: "300",
    color: "#374151",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6b7280",
  },
  iconButton: {
    width: 40,
    height: 40,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    gap: 12,
    marginBottom: 24,
  },
  reportCard: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reportContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  reportIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  reportText: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
  },
  reportSubtitle: {
    fontSize: 14,
    color: "#6b7280",
  },
  viewButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    backgroundColor: "transparent",
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  currentReportCard: {
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
  currentReportHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  currentReportTitle: {
    fontSize: 18,
    fontWeight: "500",
    color: "#374151",
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  metricCard: {
    width: "47%",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  metricValue: {
    fontSize: 20,
    fontWeight: "300",
    color: "#374151",
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
  },
  metricChange: {
    fontSize: 12,
    fontWeight: "500",
  },
  insightsCard: {
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  insightsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  insightsTitle: {
    fontSize: 18,
    fontWeight: "500",
    color: "#374151",
  },
  insightsList: {
    gap: 12,
  },
  insightItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  insightDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  insightText: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 2,
  },
  insightSubtitle: {
    fontSize: 12,
    color: "#6b7280",
  },
  recommendationsCard: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  recommendationsTitle: {
    fontSize: 18,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 12,
  },
  recommendationsList: {
    gap: 8,
  },
  recommendationItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  recommendationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  recommendationText: {
    fontSize: 14,
    color: "#6b7280",
  },
  bottomAction: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  customReportButton: {
    backgroundColor: "#3b82f6",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  customReportButtonText: {
    fontSize: 16,
    color: "#ffffff",
    fontWeight: "500",
  },
})
