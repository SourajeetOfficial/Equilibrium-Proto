import api from "../config/api"

export const moodService = {
  // Log mood entry
  logMood: async (moodData) => {
    try {
      const response = await api.post("/mood", moodData)
      return response.data
    } catch (error) {
      throw error
    }
  },

  // Get mood history
  getMoodHistory: async (period = "7d") => {
    try {
      const response = await api.get(`/mood/history?period=${period}`)
      return response.data
    } catch (error) {
      throw error
    }
  },

  // Get mood analytics
  getMoodAnalytics: async () => {
    try {
      const response = await api.get("/mood/analytics")
      return response.data
    } catch (error) {
      throw error
    }
  },
}
