// File: services/JournalService.js
import localStorageService from "./localStorageService"

class JournalService {
  constructor() {
    this.initialized = false
  }

  async initialize() {
    if (!this.initialized) {
      await localStorageService.initialize()
      this.initialized = true
    }
  }

  // Perform local sentiment analysis (simplified)
  analyzeSentiment(text) {
    const positiveWords = [
      "happy", "good", "great", "amazing", "wonderful",
      "love", "joy", "excited", "grateful", "peaceful",
    ]
    const negativeWords = [
      "sad", "bad", "terrible", "awful", "hate",
      "angry", "depressed", "anxious", "worried", "stressed",
    ]

    const words = text.toLowerCase().split(/\s+/)
    let positiveCount = 0
    let negativeCount = 0

    words.forEach((word) => {
      if (positiveWords.includes(word)) positiveCount++
      if (negativeWords.includes(word)) negativeCount++
    })

    if (positiveCount > negativeCount) return { sentiment: "positive", score: 4 }
    if (negativeCount > positiveCount) return { sentiment: "negative", score: 2 }
    return { sentiment: "neutral", score: 3 }
  }

  // Create new journal entry
  async createEntry(entryData) {
    try {
      await this.initialize()
      const { text, mood } = entryData
      const sentimentAnalysis = this.analyzeSentiment(text)

      const entry = {
        text,
        mood: mood || sentimentAnalysis.score,
        sentiment: sentimentAnalysis.sentiment,
      }

      // ✅ delegate encryption + storage to LocalStorageService
      const savedEntry = await localStorageService.saveJournalEntry(entry)
      return { success: true, entry: savedEntry }
    } catch (error) {
      console.error("Journal creation error:", error)
      return { success: false, message: "Failed to save journal entry" }
    }
  }

  // Get multiple entries
  async getEntries(limit = 50) {
    try {
      await this.initialize()
      const entries = await localStorageService.getJournalEntries(limit)
      return { success: true, entries }
    } catch (error) {
      console.error("Journal fetch error:", error)
      return { success: false, message: "Failed to fetch journal entries" }
    }
  }

  // Get single entry
  async getEntry(id) {
    try {
      await this.initialize()
      const entries = await localStorageService.getJournalEntries()
      const entry = entries.find((e) => e.id === id)
      if (!entry) return { success: false, message: "Journal entry not found" }
      return { success: true, entry }
    } catch (error) {
      console.error("Journal fetch error:", error)
      return { success: false, message: "Failed to fetch journal entry" }
    }
  }

  // Delete entry
  async deleteEntry(id) {
    try {
      await this.initialize()
      const ok = await localStorageService.deleteJournalEntry(id)
      return { success: ok }
    } catch (error) {
      console.error("Journal deletion error:", error)
      return { success: false, message: "Failed to delete journal entry" }
    }
  }

  // Get mood statistics
  async getMoodStats(days = 30) {
    try {
      await this.initialize()
      const entries = await localStorageService.getJournalEntries()

      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - days)

      const recent = entries.filter((entry) => new Date(entry.timestamp) >= cutoff)

      const moodCounts = {}
      const sentimentCounts = { positive: 0, neutral: 0, negative: 0 }

      recent.forEach((entry) => {
        if (entry.mood) moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1
        if (entry.sentiment) sentimentCounts[entry.sentiment]++
      })

      return {
        success: true,
        data: { moodCounts, sentimentCounts, totalEntries: recent.length },
      }
    } catch (error) {
      console.error("Mood stats error:", error)
      return { success: false, message: "Failed to get mood statistics" }
    }
  }
}

export default new JournalService()
