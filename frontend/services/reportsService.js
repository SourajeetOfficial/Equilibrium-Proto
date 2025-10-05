import api from "../config/api"
import wellnessService from "./wellnessService"

class ReportsService {
  // Get reports from backend
  async getReports(type = "weekly", period = null) {
    try {
      const queryParams = new URLSearchParams()
      queryParams.append("type", type)
      if (period) queryParams.append("period", period)

      const response = await api.get(`/reports?${queryParams.toString()}`)
      return { success: true, reports: response.data.reports || response.data }
    } catch (error) {
      console.error("Get reports error:", error)
      return {
        success: false,
        message: error.response?.data?.message || "Failed to fetch reports",
      }
    }
  }

  // Generate custom report
  async generateCustomReport(reportConfig) {
    try {
      const response = await api.post("/reports/generate", {
        type: reportConfig.type,
        startDate: reportConfig.startDate,
        endDate: reportConfig.endDate,
        metrics: reportConfig.metrics || ["wellness", "mood", "sleep", "screenTime"],
        format: reportConfig.format || "json",
      })
      return { success: true, report: response.data }
    } catch (error) {
      console.error("Generate custom report error:", error)
      return {
        success: false,
        message: error.response?.data?.message || "Failed to generate custom report",
      }
    }
  }

  // Generate local wellness report
  async generateLocalReport(days = 7) {
    try {
      const wellnessData = await wellnessService.getWellnessData(days)

      if (wellnessData.length === 0) {
        return { success: false, message: "No data available for report" }
      }

      // Calculate averages
      const avgWellnessScore = wellnessData.reduce((sum, day) => sum + day.wellnessScore, 0) / wellnessData.length
      const avgSleepHours = wellnessData.reduce((sum, day) => sum + day.sleepHours, 0) / wellnessData.length
      const avgScreenTime = wellnessData.reduce((sum, day) => sum + day.screenTimeMinutes, 0) / wellnessData.length
      const avgMoodScore = wellnessData.reduce((sum, day) => sum + day.moodScore, 0) / wellnessData.length

      // Calculate trends
      const firstHalf = wellnessData.slice(Math.floor(wellnessData.length / 2))
      const secondHalf = wellnessData.slice(0, Math.floor(wellnessData.length / 2))

      const firstHalfAvg = firstHalf.reduce((sum, day) => sum + day.wellnessScore, 0) / firstHalf.length
      const secondHalfAvg = secondHalf.reduce((sum, day) => sum + day.wellnessScore, 0) / secondHalf.length

      const trend = secondHalfAvg > firstHalfAvg ? "improving" : secondHalfAvg < firstHalfAvg ? "declining" : "stable"

      // Generate insights
      const insights = this.generateInsights({
        avgWellnessScore,
        avgSleepHours,
        avgScreenTime,
        avgMoodScore,
        trend,
      })

      const report = {
        id: Date.now().toString(),
        period: `${days} days`,
        generatedAt: new Date().toISOString(),
        summary: {
          avgWellnessScore: Math.round(avgWellnessScore),
          avgSleepHours: Math.round(avgSleepHours * 10) / 10,
          avgScreenTimeHours: Math.round((avgScreenTime / 60) * 10) / 10,
          avgMoodScore: Math.round(avgMoodScore * 10) / 10,
          trend,
        },
        insights,
        data: wellnessData,
      }

      return { success: true, report }
    } catch (error) {
      console.error("Generate local report error:", error)
      return { success: false, message: "Failed to generate report" }
    }
  }

  // Generate insights based on data
  generateInsights(summary) {
    const insights = []

    // Sleep insights
    if (summary.avgSleepHours < 7) {
      insights.push({
        type: "sleep",
        title: "Sleep Improvement Needed",
        message: `Your average sleep of ${summary.avgSleepHours} hours is below the recommended 7-9 hours.`,
        recommendation: "Try establishing a consistent bedtime routine and avoiding screens before bed.",
        priority: "high",
      })
    } else if (summary.avgSleepHours >= 7 && summary.avgSleepHours <= 9) {
      insights.push({
        type: "sleep",
        title: "Great Sleep Habits",
        message: `Your sleep duration of ${summary.avgSleepHours} hours is in the optimal range.`,
        recommendation: "Keep up the good work with your sleep routine!",
        priority: "low",
      })
    }

    // Screen time insights
    if (summary.avgScreenTimeHours > 6) {
      insights.push({
        type: "digital_wellbeing",
        title: "High Screen Time Detected",
        message: `Your average screen time of ${summary.avgScreenTimeHours} hours may be impacting your wellbeing.`,
        recommendation: "Consider setting app limits and taking regular breaks from screens.",
        priority: "medium",
      })
    }

    // Mood insights
    if (summary.avgMoodScore < 3) {
      insights.push({
        type: "mood",
        title: "Mood Support Available",
        message: "Your mood scores suggest you might benefit from additional support.",
        recommendation: "Consider reaching out to a mental health professional or trusted friend.",
        priority: "high",
      })
    }

    // Trend insights
    if (summary.trend === "improving") {
      insights.push({
        type: "trend",
        title: "Positive Trend",
        message: "Your wellness score is showing improvement over time.",
        recommendation: "Keep up whatever positive changes you've been making!",
        priority: "low",
      })
    } else if (summary.trend === "declining") {
      insights.push({
        type: "trend",
        title: "Declining Trend",
        message: "Your wellness score has been declining recently.",
        recommendation: "Consider reviewing your recent habits and seeking support if needed.",
        priority: "high",
      })
    }

    return insights
  }

  // Export report data
  async exportReport(reportId, format = "json") {
    try {
      const response = await api.get(`/reports/${reportId}/export?format=${format}`)
      return { success: true, data: response.data }
    } catch (error) {
      console.error("Export report error:", error)
      return {
        success: false,
        message: error.response?.data?.message || "Failed to export report",
      }
    }
  }
}

export default new ReportsService()
