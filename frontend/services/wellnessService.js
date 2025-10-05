import AsyncStorage from "@react-native-async-storage/async-storage"
import api from "../config/api"
import authService from "./authService"
import behavioralTrackingService from "./behavioralTrackingService"

class WellnessService {
  constructor() {
    this.baselineData = null
    this.isCalibrated = false
  }

  // Calculate Holistic Wellness Score with optional sleep
  calculateWellnessScore(metrics) {
    const { sleepHours, moodScore, usageStats, activityMinutes = 0 } = metrics

    // If sleep data is provided, use full calculation
    if (sleepHours !== null && sleepHours !== undefined) {
      return behavioralTrackingService.calculateFullWellnessScore(usageStats, moodScore, sleepHours, activityMinutes)
    } else {
      // Use calculation without sleep data
      return behavioralTrackingService.calculateWellnessScoreWithoutSleep(usageStats, moodScore)
    }
  }

  // Store daily metrics locally with optional sleep
  async storeDailyMetrics(metrics) {
    try {
      const today = new Date().toISOString().split("T")[0]

      // Get usage stats if tracking is enabled
      let usageStats = {}
      if (behavioralTrackingService.hasConsent()) {
        usageStats = await behavioralTrackingService.getDailyUsageStats(today)
      }

      const wellnessScore = this.calculateWellnessScore({
        ...metrics,
        usageStats,
      })

      const dailyData = {
        date: today,
        ...metrics,
        usageStats,
        wellnessScore,
        timestamp: new Date().toISOString(),
        hasSleepData: metrics.sleepHours !== null && metrics.sleepHours !== undefined,
        hasUsageData: behavioralTrackingService.hasConsent(),
      }

      // Store locally
      const existingData = await AsyncStorage.getItem("dailyMetrics")
      const metricsArray = existingData ? JSON.parse(existingData) : []

      // Remove existing entry for today if it exists
      const filteredMetrics = metricsArray.filter((item) => item.date !== today)
      filteredMetrics.unshift(dailyData)

      // Keep only last 90 days
      if (filteredMetrics.length > 90) {
        filteredMetrics.splice(90)
      }

      await AsyncStorage.setItem("dailyMetrics", JSON.stringify(filteredMetrics))

      // Check for anomalies
      await this.checkForAnomalies(filteredMetrics)

      // Sync with backend if consent given
      await this.syncAggregateData(dailyData)

      return { success: true, wellnessScore, hasUsageData: behavioralTrackingService.hasConsent() }
    } catch (error) {
      console.error("Error storing daily metrics:", error)
      return { success: false, error: error.message }
    }
  }

  // Check for anomalies in wellness score
  async checkForAnomalies(metricsArray) {
    try {
      if (metricsArray.length < 14) {
        // Not enough data for baseline
        return
      }

      // Calculate 14-day baseline (excluding last 3 days)
      const baselineData = metricsArray.slice(3, 17)
      const baselineAvg = baselineData.reduce((sum, item) => sum + item.wellnessScore, 0) / baselineData.length

      // Calculate 3-day moving average
      const recentData = metricsArray.slice(0, 3)
      const recentAvg = recentData.reduce((sum, item) => sum + item.wellnessScore, 0) / recentData.length

      // Check for significant drop (>20%)
      const percentageChange = ((recentAvg - baselineAvg) / baselineAvg) * 100

      if (percentageChange <= -20) {
        // Trigger wellness alert
        await this.triggerWellnessAlert({
          type: "wellness_decline",
          baselineScore: Math.round(baselineAvg),
          currentScore: Math.round(recentAvg),
          percentageChange: Math.round(percentageChange),
        })
      }

      // Check for prolonged anomaly (7+ days)
      const weekData = metricsArray.slice(0, 7)
      const weekAvg = weekData.reduce((sum, item) => sum + item.wellnessScore, 0) / weekData.length
      const weekChange = ((weekAvg - baselineAvg) / baselineAvg) * 100

      if (weekChange <= -20) {
        // Trigger crisis alert
        await this.triggerCrisisAlert({
          type: "prolonged_decline",
          baselineScore: Math.round(baselineAvg),
          weekScore: Math.round(weekAvg),
          percentageChange: Math.round(weekChange),
        })
      }
    } catch (error) {
      console.error("Error checking for anomalies:", error)
    }
  }

  // Trigger wellness alert
  async triggerWellnessAlert(alertData) {
    try {
      // Store alert locally
      const alerts = await AsyncStorage.getItem("wellnessAlerts")
      const alertsArray = alerts ? JSON.parse(alerts) : []

      const newAlert = {
        id: Date.now().toString(),
        ...alertData,
        timestamp: new Date().toISOString(),
        acknowledged: false,
      }

      alertsArray.unshift(newAlert)
      await AsyncStorage.setItem("wellnessAlerts", JSON.stringify(alertsArray))

      // Trigger backend alert if consent given
      const consentFlags = authService.getConsentFlags()
      if (consentFlags && consentFlags.usageTracking) {
        try {
          await api.post("/alerts/trigger", {
            type: alertData.type,
            severity: "medium",
            data: alertData,
          })
        } catch (error) {
          console.error("Failed to send alert to backend:", error)
        }
      }

      return newAlert
    } catch (error) {
      console.error("Error triggering wellness alert:", error)
    }
  }

  // Trigger crisis alert
  async triggerCrisisAlert(alertData) {
    try {
      // Store alert locally
      const alerts = await AsyncStorage.getItem("crisisAlerts")
      const alertsArray = alerts ? JSON.parse(alerts) : []

      const newAlert = {
        id: Date.now().toString(),
        ...alertData,
        timestamp: new Date().toISOString(),
        acknowledged: false,
      }

      alertsArray.unshift(newAlert)
      await AsyncStorage.setItem("crisisAlerts", JSON.stringify(alertsArray))

      // Always trigger backend alert for crisis
      try {
        await api.post("/alerts/trigger", {
          type: alertData.type,
          severity: "high",
          data: alertData,
        })
      } catch (error) {
        console.error("Failed to send crisis alert to backend:", error)
      }

      return newAlert
    } catch (error) {
      console.error("Error triggering crisis alert:", error)
    }
  }

  // Sync aggregate data with backend
  async syncAggregateData(dailyData) {
    try {
      const consentFlags = authService.getConsentFlags()
      if (!consentFlags || !consentFlags.usageTracking) {
        return // User hasn't consented to data sharing
      }

      // Prepare aggregated data (no raw content)
      const aggregateData = {
        date: dailyData.date,
        avgSleepHours: dailyData.sleepHours || null,
        screenTimeMinutes: dailyData.usageStats?.screenTimeMinutes || null,
        pickupCount: dailyData.usageStats?.pickupCount || null,
        sentimentLabel: this.getSentimentLabel(dailyData.moodScore),
        wellnessScore: dailyData.wellnessScore,
        hasSleepData: dailyData.hasSleepData,
        hasUsageData: dailyData.hasUsageData,
      }

      await api.post("/aggregates", aggregateData)
    } catch (error) {
      console.error("Error syncing aggregate data:", error)
    }
  }

  // Convert mood score to sentiment label
  getSentimentLabel(moodScore) {
    if (moodScore >= 4) return "positive"
    if (moodScore >= 3) return "neutral"
    return "negative"
  }

  // Get local wellness data
  async getWellnessData(days = 30) {
    try {
      const data = await AsyncStorage.getItem("dailyMetrics")
      const metricsArray = data ? JSON.parse(data) : []
      return metricsArray.slice(0, days)
    } catch (error) {
      console.error("Error getting wellness data:", error)
      return []
    }
  }

  // Get wellness alerts
  async getWellnessAlerts() {
    try {
      const alerts = await AsyncStorage.getItem("wellnessAlerts")
      return alerts ? JSON.parse(alerts) : []
    } catch (error) {
      console.error("Error getting wellness alerts:", error)
      return []
    }
  }

  // Acknowledge alert
  async acknowledgeAlert(alertId) {
    try {
      const alerts = await AsyncStorage.getItem("wellnessAlerts")
      const alertsArray = alerts ? JSON.parse(alerts) : []

      const updatedAlerts = alertsArray.map((alert) =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert,
      )

      await AsyncStorage.setItem("wellnessAlerts", JSON.stringify(updatedAlerts))
      return { success: true }
    } catch (error) {
      console.error("Error acknowledging alert:", error)
      return { success: false }
    }
  }

  // Get wellness insights combining usage and wellness data
  async getWellnessInsights(days = 7) {
    try {
      const wellnessData = await this.getWellnessData(days)
      const usageInsights = behavioralTrackingService.generateUsageInsights(
        wellnessData.map((d) => d.usageStats).filter(Boolean),
      )

      // Add wellness-specific insights
      const wellnessInsights = []

      if (wellnessData.length > 0) {
        const avgScore = wellnessData.reduce((sum, d) => sum + d.wellnessScore, 0) / wellnessData.length
        const trend = this.calculateTrend(wellnessData.map((d) => d.wellnessScore))

        if (avgScore < 60) {
          wellnessInsights.push({
            type: "wellness_low",
            title: "Wellness Score Below Average",
            message: `Your average wellness score is ${Math.round(avgScore)}`,
            recommendation: "Consider focusing on digital wellbeing and mood tracking",
            priority: "high",
            icon: "trending-down",
            color: "#ef4444",
          })
        }

        if (trend === "improving") {
          wellnessInsights.push({
            type: "wellness_improving",
            title: "Wellness Improving",
            message: "Your wellness score has been trending upward",
            recommendation: "Keep up the great work!",
            priority: "low",
            icon: "trending-up",
            color: "#10b981",
          })
        }
      }

      return [...wellnessInsights, ...usageInsights]
    } catch (error) {
      console.error("Error getting wellness insights:", error)
      return []
    }
  }

  // Calculate trend from array of scores
  calculateTrend(scores) {
    if (scores.length < 3) return "stable"

    const firstHalf = scores.slice(0, Math.floor(scores.length / 2))
    const secondHalf = scores.slice(Math.floor(scores.length / 2))

    const firstAvg = firstHalf.reduce((sum, s) => sum + s, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, s) => sum + s, 0) / secondHalf.length

    const change = ((secondAvg - firstAvg) / firstAvg) * 100

    if (change > 10) return "improving"
    if (change < -10) return "declining"
    return "stable"
  }
}

export default new WellnessService()
