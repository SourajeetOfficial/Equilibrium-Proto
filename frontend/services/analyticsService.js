import localStorageService from "./localStorageService"
import behavioralTrackingService from "./behavioralTrackingService"

class AnalyticsService {
  constructor() {
    this.initialized = false
  }

  async initialize() {
    try {
      this.initialized = true
      console.log("AnalyticsService initialized")
    } catch (error) {
      console.error("AnalyticsService initialization error:", error)
      throw error
    }
  }

  // Generate comprehensive wellness analytics
  async generateWellnessAnalytics(days = 30) {
    try {
      const wellnessData = await localStorageService.getWellnessData(days)
      const journalEntries = await localStorageService.getJournalEntries()

      let usageData = []
      if (behavioralTrackingService.hasConsent()) {
        usageData = await behavioralTrackingService.getWeeklyUsageStats()
      }

      const analytics = {
        overview: this.calculateOverviewStats(wellnessData),
        trends: this.analyzeTrends(wellnessData),
        patterns: this.identifyPatterns(wellnessData, usageData),
        insights: this.generateInsights(wellnessData, journalEntries, usageData),
        recommendations: this.generateRecommendations(wellnessData, usageData),
        dataCompleteness: this.calculateDataCompleteness(wellnessData, journalEntries, usageData),
      }

      return analytics
    } catch (error) {
      console.error("Error generating wellness analytics:", error)
      return this.getDefaultAnalytics()
    }
  }

  calculateOverviewStats(wellnessData) {
    if (!wellnessData || wellnessData.length === 0) {
      return {
        avgWellnessScore: 0,
        avgMoodScore: 0,
        avgSleepHours: 0,
        totalDaysTracked: 0,
        currentStreak: 0,
      }
    }

    const validData = wellnessData.filter((day) => day.wellnessScore > 0)

    return {
      avgWellnessScore: Math.round(
        validData.reduce((sum, day) => sum + (day.wellnessScore || 0), 0) / validData.length || 0,
      ),
      avgMoodScore:
        Math.round((validData.reduce((sum, day) => sum + (day.moodScore || 0), 0) / validData.length || 0) * 10) / 10,
      avgSleepHours:
        Math.round((validData.reduce((sum, day) => sum + (day.sleepHours || 0), 0) / validData.length || 0) * 10) / 10,
      totalDaysTracked: validData.length,
      currentStreak: this.calculateCurrentStreak(wellnessData),
    }
  }

  analyzeTrends(wellnessData) {
    if (!wellnessData || wellnessData.length < 7) {
      return {
        wellnessTrend: "stable",
        moodTrend: "stable",
        sleepTrend: "stable",
        trendStrength: 0,
      }
    }

    const recentData = wellnessData.slice(0, 7)
    const olderData = wellnessData.slice(7, 14)

    const recentAvg = recentData.reduce((sum, day) => sum + (day.wellnessScore || 0), 0) / recentData.length
    const olderAvg = olderData.reduce((sum, day) => sum + (day.wellnessScore || 0), 0) / olderData.length

    const difference = recentAvg - olderAvg
    const trendStrength = Math.abs(difference)

    let wellnessTrend = "stable"
    if (difference > 5) wellnessTrend = "improving"
    else if (difference < -5) wellnessTrend = "declining"

    return {
      wellnessTrend,
      moodTrend: this.calculateMoodTrend(recentData, olderData),
      sleepTrend: this.calculateSleepTrend(recentData, olderData),
      trendStrength: Math.round(trendStrength),
    }
  }

  identifyPatterns(wellnessData, usageData) {
    const patterns = []

    // Weekly patterns
    if (wellnessData.length >= 14) {
      const weeklyPattern = this.analyzeWeeklyPatterns(wellnessData)
      if (weeklyPattern) patterns.push(weeklyPattern)
    }

    // Usage correlation patterns
    if (usageData.length > 0 && wellnessData.length > 0) {
      const usagePattern = this.analyzeUsagePatterns(wellnessData, usageData)
      if (usagePattern) patterns.push(usagePattern)
    }

    return patterns
  }

  generateInsights(wellnessData, journalEntries, usageData) {
    const insights = []

    // Wellness insights
    if (wellnessData.length > 0) {
      const avgScore = wellnessData.reduce((sum, day) => sum + (day.wellnessScore || 0), 0) / wellnessData.length

      if (avgScore > 80) {
        insights.push({
          type: "positive",
          title: "Excellent Wellness",
          message: "Your wellness scores have been consistently high!",
          icon: "trending-up",
          color: "#10b981",
        })
      } else if (avgScore < 50) {
        insights.push({
          type: "concern",
          title: "Wellness Attention Needed",
          message: "Your wellness scores suggest you might benefit from additional support.",
          icon: "alert-triangle",
          color: "#ef4444",
        })
      }
    }

    // Journal insights
    if (journalEntries.length > 0) {
      const recentEntries = journalEntries.slice(0, 7)
      if (recentEntries.length >= 5) {
        insights.push({
          type: "positive",
          title: "Great Journaling Habit",
          message: "You've been consistently journaling. This helps with self-reflection!",
          icon: "book",
          color: "#3b82f6",
        })
      }
    }

    // Usage insights
    if (usageData.length > 0) {
      const avgScreenTime = usageData.reduce((sum, day) => sum + (day.screenTimeHours || 0), 0) / usageData.length

      if (avgScreenTime > 6) {
        insights.push({
          type: "warning",
          title: "High Screen Time",
          message: `You're averaging ${avgScreenTime.toFixed(1)} hours of screen time daily.`,
          icon: "smartphone",
          color: "#f59e0b",
        })
      }
    }

    return insights
  }

  generateRecommendations(wellnessData, usageData) {
    const recommendations = []

    if (wellnessData.length === 0) {
      recommendations.push("Start tracking your daily wellness metrics for personalized insights")
      return recommendations
    }

    const recentData = wellnessData.slice(0, 7)
    const avgMood = recentData.reduce((sum, day) => sum + (day.moodScore || 3), 0) / recentData.length
    const avgSleep = recentData.reduce((sum, day) => sum + (day.sleepHours || 7), 0) / recentData.length

    if (avgMood < 3) {
      recommendations.push("Consider talking to a mental health professional or trusted friend")
    }

    if (avgSleep < 7) {
      recommendations.push("Try to get 7-9 hours of sleep each night for better mental health")
    }

    if (usageData.length > 0) {
      const avgScreenTime = usageData.reduce((sum, day) => sum + (day.screenTimeHours || 0), 0) / usageData.length
      if (avgScreenTime > 5) {
        recommendations.push("Consider reducing screen time with regular digital breaks")
      }
    }

    recommendations.push("Continue your wellness tracking for better insights over time")

    return recommendations
  }

  calculateDataCompleteness(wellnessData, journalEntries, usageData) {
    const last30Days = 30
    const wellnessCompleteness = Math.min((wellnessData.length / last30Days) * 100, 100)
    const journalCompleteness = Math.min((journalEntries.length / last30Days) * 100, 100)
    const usageCompleteness = behavioralTrackingService.hasConsent() ? Math.min((usageData.length / 7) * 100, 100) : 0

    return {
      overall: Math.round((wellnessCompleteness + journalCompleteness + usageCompleteness) / 3),
      wellness: Math.round(wellnessCompleteness),
      journal: Math.round(journalCompleteness),
      usage: Math.round(usageCompleteness),
    }
  }

  // Helper methods
  calculateCurrentStreak(wellnessData) {
    let streak = 0
    for (const day of wellnessData) {
      if (day.wellnessScore > 0) {
        streak++
      } else {
        break
      }
    }
    return streak
  }

  calculateMoodTrend(recentData, olderData) {
    const recentMood = recentData.reduce((sum, day) => sum + (day.moodScore || 3), 0) / recentData.length
    const olderMood = olderData.reduce((sum, day) => sum + (day.moodScore || 3), 0) / olderData.length

    const difference = recentMood - olderMood
    if (difference > 0.5) return "improving"
    if (difference < -0.5) return "declining"
    return "stable"
  }

  calculateSleepTrend(recentData, olderData) {
    const recentSleep = recentData.reduce((sum, day) => sum + (day.sleepHours || 7), 0) / recentData.length
    const olderSleep = olderData.reduce((sum, day) => sum + (day.sleepHours || 7), 0) / olderData.length

    const difference = recentSleep - olderSleep
    if (difference > 0.5) return "improving"
    if (difference < -0.5) return "declining"
    return "stable"
  }

  analyzeWeeklyPatterns(wellnessData) {
    // Analyze if certain days of the week have better/worse wellness scores
    const dayScores = {}

    wellnessData.forEach((day) => {
      const dayOfWeek = new Date(day.date).getDay()
      if (!dayScores[dayOfWeek]) dayScores[dayOfWeek] = []
      dayScores[dayOfWeek].push(day.wellnessScore || 0)
    })

    const dayAverages = {}
    Object.keys(dayScores).forEach((day) => {
      dayAverages[day] = dayScores[day].reduce((sum, score) => sum + score, 0) / dayScores[day].length
    })

    const bestDay = Object.keys(dayAverages).reduce((a, b) => (dayAverages[a] > dayAverages[b] ? a : b))
    const worstDay = Object.keys(dayAverages).reduce((a, b) => (dayAverages[a] < dayAverages[b] ? a : b))

    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

    return {
      type: "weekly",
      title: "Weekly Pattern",
      message: `Your wellness tends to be highest on ${dayNames[bestDay]} and lowest on ${dayNames[worstDay]}`,
      bestDay: dayNames[bestDay],
      worstDay: dayNames[worstDay],
    }
  }

  analyzeUsagePatterns(wellnessData, usageData) {
    // Simple correlation between screen time and wellness
    if (usageData.length < 5) return null

    const correlationData = usageData
      .map((usage) => {
        const wellnessDay = wellnessData.find((w) => w.date === usage.date)
        return {
          screenTime: usage.screenTimeHours || 0,
          wellness: wellnessDay?.wellnessScore || 0,
        }
      })
      .filter((d) => d.wellness > 0)

    if (correlationData.length < 3) return null

    const avgScreenTime = correlationData.reduce((sum, d) => sum + d.screenTime, 0) / correlationData.length
    const highScreenTimeDays = correlationData.filter((d) => d.screenTime > avgScreenTime)
    const lowScreenTimeDays = correlationData.filter((d) => d.screenTime <= avgScreenTime)

    const highScreenTimeWellness =
      highScreenTimeDays.reduce((sum, d) => sum + d.wellness, 0) / highScreenTimeDays.length
    const lowScreenTimeWellness = lowScreenTimeDays.reduce((sum, d) => sum + d.wellness, 0) / lowScreenTimeDays.length

    if (lowScreenTimeWellness > highScreenTimeWellness + 10) {
      return {
        type: "usage",
        title: "Screen Time Impact",
        message: "Your wellness scores tend to be higher on days with less screen time",
        correlation: "negative",
      }
    }

    return null
  }

  getDefaultAnalytics() {
    return {
      overview: {
        avgWellnessScore: 0,
        avgMoodScore: 0,
        avgSleepHours: 0,
        totalDaysTracked: 0,
        currentStreak: 0,
      },
      trends: {
        wellnessTrend: "stable",
        moodTrend: "stable",
        sleepTrend: "stable",
        trendStrength: 0,
      },
      patterns: [],
      insights: [
        {
          type: "info",
          title: "Start Your Journey",
          message: "Begin tracking your wellness to get personalized insights",
          icon: "info",
          color: "#6b7280",
        },
      ],
      recommendations: ["Start tracking your daily wellness metrics"],
      dataCompleteness: {
        overall: 0,
        wellness: 0,
        journal: 0,
        usage: 0,
      },
    }
  }
}

export default new AnalyticsService()
