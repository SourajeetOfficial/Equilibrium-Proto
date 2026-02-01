class OnDeviceAIService {
  constructor() {
    this.initialized = false
    this.sentimentModel = null
  }

  async initialize() {
    try {
      // Initialize on-device AI models
      this.initialized = true
      console.log("OnDeviceAIService initialized")
    } catch (error) {
      console.error("OnDeviceAIService initialization error:", error)
      throw error
    }
  }

  // Simple sentiment analysis using keyword matching
  analyzeSentiment(text) {
    if (!text || typeof text !== "string") {
      return { score: 0, confidence: 0, label: "neutral" }
    }

    const positiveWords = [
      "happy",
      "joy",
      "love",
      "excited",
      "grateful",
      "amazing",
      "wonderful",
      "great",
      "fantastic",
      "excellent",
      "good",
      "positive",
      "blessed",
      "thankful",
      "proud",
      "accomplished",
      "successful",
      "hopeful",
      "optimistic",
    ]

    const negativeWords = [
      "sad",
      "angry",
      "depressed",
      "anxious",
      "worried",
      "stressed",
      "upset",
      "frustrated",
      "disappointed",
      "lonely",
      "tired",
      "exhausted",
      "overwhelmed",
      "hopeless",
      "worthless",
      "afraid",
      "scared",
      "panic",
      "crisis",
      "terrible",
    ]

    const words = text.toLowerCase().split(/\s+/)
    let positiveCount = 0
    let negativeCount = 0

    words.forEach((word) => {
      if (positiveWords.includes(word)) positiveCount++
      if (negativeWords.includes(word)) negativeCount++
    })

    const totalSentimentWords = positiveCount + negativeCount
    const confidence = totalSentimentWords > 0 ? Math.min((totalSentimentWords / words.length) * 10, 1) : 0

    let score = 0
    let label = "neutral"

    if (totalSentimentWords > 0) {
      score = (positiveCount - negativeCount) / totalSentimentWords
      if (score > 0.2) label = "positive"
      else if (score < -0.2) label = "negative"
    }

    return {
      score: Math.round((score + 1) * 2.5), // Convert to 0-5 scale
      confidence: Math.round(confidence * 100),
      label,
      details: {
        positiveWords: positiveCount,
        negativeWords: negativeCount,
        totalWords: words.length,
      },
    }
  }

  // Calculate wellness score based on multiple factors
  calculateWellnessScore(metrics) {
    try {
      const { sleepHours = 7, moodScore = 3, screenTimeMinutes = 240, activityMinutes = 0} = metrics

      // Sleep score (0-25 points)
      let sleepScore = 0
      if (sleepHours >= 7 && sleepHours <= 9) sleepScore = 25
      else if (sleepHours >= 6 && sleepHours <= 10) sleepScore = 20
      else if (sleepHours >= 5 && sleepHours <= 11) sleepScore = 15
      else sleepScore = 10

      // Mood score (0-25 points)
      const moodScoreNormalized = Math.max(0, Math.min(5, moodScore))
      const moodPoints = (moodScoreNormalized / 5) * 25

      // Screen time score (0-25 points)
      let screenTimeScore = 0
      if (screenTimeMinutes <= 120) screenTimeScore = 25
      else if (screenTimeMinutes <= 240) screenTimeScore = 20
      else if (screenTimeMinutes <= 360) screenTimeScore = 15
      else if (screenTimeMinutes <= 480) screenTimeScore = 10
      else screenTimeScore = 5

      // Activity score (0-25 points)
      let activityScore = 0
      if (activityMinutes >= 60) activityScore = 25
      else if (activityMinutes >= 30) activityScore = 20
      else if (activityMinutes >= 15) activityScore = 15
      else if (activityMinutes >= 5) activityScore = 10
      else activityScore = 5

      const totalScore = sleepScore + moodPoints + screenTimeScore + activityScore
      return Math.round(totalScore)
    } catch (error) {
      console.error("Calculate wellness score error:", error)
      return 50 // Default score
    }
  }

  // Generate wellness insights based on data patterns
  generateWellnessInsights(wellnessData) {
    try {
      if (!wellnessData || wellnessData.length === 0) {
        return [
          {
            type: "info",
            title: "Start Your Wellness Journey",
            message: "Begin tracking your wellness to get personalized insights.",
            recommendation: "Log your mood and activities daily for better insights.",
            icon: "information-circle",
            color: "#6b7280",
          },
        ]
      }

      const insights = []
      const recentData = wellnessData.slice(0, 7) // Last 7 days

      // Analyze trends
      const avgWellness = recentData.reduce((sum, day) => sum + (day.wellnessScore || 0), 0) / recentData.length
      const avgMood = recentData.reduce((sum, day) => sum + (day.moodScore || 3), 0) / recentData.length
      const avgSleep = recentData.reduce((sum, day) => sum + (day.sleepHours || 7), 0) / recentData.length

      // Wellness trend insight
      if (avgWellness < 60) {
        insights.push({
          type: "warning",
          title: "Wellness Attention Needed",
          message: "Your wellness score has been below average this week.",
          recommendation: "Consider focusing on sleep, reducing screen time, or talking to someone.",
          icon: "alert-triangle",
          color: "#f59e0b",
        })
      } else if (avgWellness > 80) {
        insights.push({
          type: "positive",
          title: "Excellent Wellness!",
          message: "Great job! Your wellness score has been consistently high.",
          recommendation: "Keep up the good habits that are working for you.",
          icon: "trending-up",
          color: "#10b981",
        })
      }

      // Sleep insight
      if (avgSleep < 6.5) {
        insights.push({
          type: "warning",
          title: "Sleep Improvement Needed",
          message: "You've been getting less sleep than recommended.",
          recommendation: "Try to get 7-9 hours of sleep for better mental health.",
          icon: "moon",
          color: "#8b5cf6",
        })
      }

      // Mood insight
      if (avgMood < 2.5) {
        insights.push({
          type: "concern",
          title: "Mood Support Recommended",
          message: "Your mood has been consistently low this week.",
          recommendation: "Consider reaching out to a mental health professional or trusted friend.",
          icon: "heart",
          color: "#ef4444",
        })
      }

      return insights.length > 0
        ? insights
        : [
            {
              type: "info",
              title: "Wellness Patterns Look Stable",
              message: "Your wellness patterns appear consistent.",
              recommendation: "Continue your current routine and track daily for more insights.",
              icon: "checkmark-circle",
              color: "#10b981",
            },
          ]
    } catch (error) {
      console.error("Generate wellness insights error:", error)
      return [
        {
          type: "error",
          title: "Insights Unavailable",
          message: "Unable to generate insights at this time.",
          recommendation: "Please try again later.",
          icon: "alert-circle",
          color: "#ef4444",
        },
      ]
    }
  }

  // Detect wellness anomalies
  detectAnomalies(wellnessData) {
    try {
      if (!wellnessData || wellnessData.length < 3) return []

      const anomalies = []
      const recentData = wellnessData.slice(0, 7)

      // Check for sudden drops in wellness score
      for (let i = 0; i < recentData.length - 1; i++) {
        const current = recentData[i].wellness_score || 0
        const previous = recentData[i + 1].wellness_score || 0

        if (previous - current > 20) {
          anomalies.push({
            type: "wellness_drop",
            date: recentData[i].date,
            severity: "medium",
            message: "Significant drop in wellness score detected.",
          })
        }
      }

      // Check for consistently low mood
      const lowMoodDays = recentData.filter((day) => (day.mood_score || 3) < 2).length
      if (lowMoodDays >= 3) {
        anomalies.push({
          type: "low_mood_pattern",
          severity: "high",
          message: "Consistently low mood detected over multiple days.",
        })
      }

      return anomalies
    } catch (error) {
      console.error("Detect anomalies error:", error)
      return []
    }
  }

  // Generate personalized recommendations
  generateRecommendations(userProfile, wellnessData) {
    try {
      const recommendations = []

      if (!wellnessData || wellnessData.length === 0) {
        return [
          "Start by tracking your daily mood and activities",
          "Set a consistent sleep schedule",
          "Take short breaks from screens throughout the day",
        ]
      }

      const recentData = wellnessData.slice(0, 7)
      const avgSleep = recentData.reduce((sum, day) => sum + (day.sleep_hours || 7), 0) / recentData.length
      const avgMood = recentData.reduce((sum, day) => sum + (day.mood_score || 3), 0) / recentData.length

      if (avgSleep < 7) {
        recommendations.push("Try to get 7-9 hours of sleep each night for better mental health")
      }

      if (avgMood < 3) {
        recommendations.push("Consider practicing mindfulness or talking to someone you trust")
      }

      recommendations.push("Take regular breaks from screens to reduce digital fatigue")
      recommendations.push("Engage in physical activity, even a short walk can help")

      return recommendations
    } catch (error) {
      console.error("Generate recommendations error:", error)
      return ["Focus on getting enough sleep and staying connected with others"]
    }
  }
}

export default new OnDeviceAIService()
