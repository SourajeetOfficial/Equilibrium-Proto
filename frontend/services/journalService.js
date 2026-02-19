// File: frontend/services/journalService.js
import localStorageService from "./localStorageService";
import onDeviceAIService from "./onDeviceAIService";

class JournalService {
  constructor() {
    this.initialized = false;
  }

  async initialize() {
    if (!this.initialized) {
      await localStorageService.initialize();
      await onDeviceAIService.initialize();
      this.initialized = true;
    }
  }

  /**
   * Get today's date string in YYYY-MM-DD format
   */
  getTodayDate() {
    return new Date().toISOString().split("T")[0];
  }

  /**
   * Format date for display
   */
  formatDateForDisplay(dateString) {
    const date = new Date(dateString + "T00:00:00");
    return {
      full: date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      short: date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
      day: date.toLocaleDateString("en-US", { weekday: "long" }),
      dateOnly: date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    };
  }

  /**
   * Check if a date is today
   */
  isToday(dateString) {
    return dateString === this.getTodayDate();
  }

  /**
   * Check if a date is in the future
   */
  isFutureDate(dateString) {
    return dateString > this.getTodayDate();
  }

  /**
   * Get previous day's date string
   */
  getPreviousDate(dateString) {
    const date = new Date(dateString + "T00:00:00");
    date.setDate(date.getDate() - 1);
    return date.toISOString().split("T")[0];
  }

  /**
   * Get next day's date string
   */
  getNextDate(dateString) {
    const date = new Date(dateString + "T00:00:00");
    date.setDate(date.getDate() + 1);
    return date.toISOString().split("T")[0];
  }

  /**
   * Get or create journal for a specific date
   */
  async getJournal(date = null) {
    try {
      await this.initialize();
      const targetDate = date || this.getTodayDate();
      // Finalization is now handled explicitly by App.js on foreground,
      // not as a silent side-effect of reading a journal.
      const journal = await localStorageService.getDailyJournal(targetDate);
      return { success: true, journal };
    } catch (error) {
      console.error("Get journal error:", error);
      return { success: false, message: "Failed to get journal" };
    }
  }

  /**
   * Finalize yesterday's journal when the app comes to foreground on a new day.
   * Called explicitly by App.js — not buried in read operations.
   */
  async finalizeYesterdayIfNeeded(yesterdayDate, todayDate) {
    try {
      await this.initialize();
      const yesterday = await localStorageService.getDailyJournal(yesterdayDate);
      if (yesterday && !yesterday.isFinalized && yesterday.logs && yesterday.logs.length > 0) {
        await localStorageService.finalizeJournal(yesterdayDate);
        console.log("Finalized journal for:", yesterdayDate);
      }
    } catch (error) {
      console.warn("finalizeYesterdayIfNeeded error:", error);
    }
  }

  /**
   * Add a text entry to journal
   * Optimized: single read + single write (collapsed from 5 storage ops)
   */
  async addTextEntry(text, date = null) {
    try {
      await this.initialize();
      const targetDate = date || this.getTodayDate();
      
      if (!this.isToday(targetDate)) {
        return { success: false, message: "Can only add entries to today's journal" };
      }

      const analysis = onDeviceAIService.analyzeSentiment(text);

      // Single read: get current journal state
      const journal = await localStorageService.getDailyJournal(targetDate);

      // Build new log entry
      const newLog = {
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        deleted: false,
        type: "text",
        text: text.trim(),
        sentiment: analysis.sentiment,
        sentimentScore: analysis.score,
        sentimentEmoji: analysis.emoji,
        confidence: analysis.confidence,
      };

      // Append log and recalculate score in memory (no extra reads)
      journal.logs.push(newLog);
      const scoreResult = onDeviceAIService.calculateJournalScore(journal.logs);

      journal.scoreHistory.push({
        timestamp: new Date().toISOString(),
        score: scoreResult.score,
        sentiment: scoreResult.sentiment,
        emoji: scoreResult.emoji,
      });
      journal.currentScore = scoreResult.score;
      journal.currentSentiment = scoreResult.sentiment;
      journal.sentimentEmoji = scoreResult.emoji;

      // Single write: persist everything at once
      const updatedJournal = await localStorageService.saveDailyJournal(targetDate, journal);

      return { success: true, log: newLog, journal: updatedJournal };
    } catch (error) {
      console.error("Add text entry error:", error);
      return { success: false, message: "Failed to add entry" };
    }
  }

  /**
   * Add a mood entry to journal
   * Optimized: single read + single write
   */
  async addMoodEntry(moodKey, date = null) {
    try {
      await this.initialize();
      const targetDate = date || this.getTodayDate();
      
      if (!this.isToday(targetDate)) {
        return { success: false, message: "Can only add entries to today's journal" };
      }

      const moodDef = onDeviceAIService.getMoodDefinition(moodKey);
      const analysis = onDeviceAIService.analyzeMood(moodKey);

      // Single read
      const journal = await localStorageService.getDailyJournal(targetDate);

      const newLog = {
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        deleted: false,
        type: "mood",
        moodKey,
        text: moodDef.text,
        moodEmoji: moodDef.emoji,
        moodLabel: moodDef.label,
        sentiment: moodKey,
        sentimentScore: analysis.score,
        sentimentEmoji: moodDef.emoji,
        confidence: 100,
      };

      journal.logs.push(newLog);
      const scoreResult = onDeviceAIService.calculateJournalScore(journal.logs);

      journal.scoreHistory.push({
        timestamp: new Date().toISOString(),
        score: scoreResult.score,
        sentiment: scoreResult.sentiment,
        emoji: scoreResult.emoji,
      });
      journal.currentScore = scoreResult.score;
      journal.currentSentiment = scoreResult.sentiment;
      journal.sentimentEmoji = scoreResult.emoji;

      // Single write
      const updatedJournal = await localStorageService.saveDailyJournal(targetDate, journal);

      return { success: true, log: newLog, journal: updatedJournal };
    } catch (error) {
      console.error("Add mood entry error:", error);
      return { success: false, message: "Failed to add mood entry" };
    }
  }

  /**
   * Delete a log entry (soft delete)
   */
  async deleteLog(logId, date = null) {
    try {
      await this.initialize();
      const targetDate = date || this.getTodayDate();
      
      const success = await localStorageService.deleteJournalLog(targetDate, logId);
      
      if (!success) {
        return { success: false, message: "Failed to delete entry" };
      }

      // Get updated journal (score remains unchanged as per requirement)
      const journal = await localStorageService.getDailyJournal(targetDate);

      return { success: true, journal };
    } catch (error) {
      console.error("Delete log error:", error);
      return { success: false, message: "Failed to delete entry" };
    }
  }

  /**
   * Delete entire journal for a day
   */
  async deleteJournal(date) {
    try {
      await this.initialize();
      
      const success = await localStorageService.deleteDailyJournal(date);
      
      return { success };
    } catch (error) {
      console.error("Delete journal error:", error);
      return { success: false, message: "Failed to delete journal" };
    }
  }

  /**
   * Recalculate and update journal score based on all logs
   */
  async recalculateScore(date = null) {
    try {
      const targetDate = date || this.getTodayDate();
      const journal = await localStorageService.getDailyJournal(targetDate);
      
      const scoreResult = onDeviceAIService.calculateJournalScore(journal.logs);

      await localStorageService.updateJournalScore(
        targetDate,
        scoreResult.score,
        scoreResult.sentiment,
        scoreResult.emoji
      );

      // Return updated journal
      return await localStorageService.getDailyJournal(targetDate);
    } catch (error) {
      console.error("Recalculate score error:", error);
      return null;
    }
  }

  /**
   * Get journal settings
   */
  async getSettings() {
    try {
      await this.initialize();
      return await localStorageService.getJournalSettings();
    } catch (error) {
      console.error("Get settings error:", error);
      return { showDevScore: false };
    }
  }

  /**
   * Update journal settings
   */
  async updateSettings(settings) {
    try {
      await this.initialize();
      await localStorageService.saveJournalSettings(settings);
      return { success: true };
    } catch (error) {
      console.error("Update settings error:", error);
      return { success: false };
    }
  }

  /**
   * Get all available mood options
   */
  getMoodOptions() {
    return onDeviceAIService.getMoodOptions();
  }

  /**
   * Get journals for date range (for reports)
   */
  async getJournalsInRange(startDate, endDate) {
    try {
      await this.initialize();
      return await localStorageService.getJournalsInRange(startDate, endDate);
    } catch (error) {
      console.error("Get journals in range error:", error);
      return [];
    }
  }

  /**
   * Get score history for a specific date (for graph)
   */
  async getScoreHistory(date = null) {
    try {
      await this.initialize();
      const targetDate = date || this.getTodayDate();
      const journal = await localStorageService.getDailyJournal(targetDate);
      
      return {
        success: true,
        scoreHistory: journal.scoreHistory || [],
        currentScore: journal.currentScore,
        currentSentiment: journal.currentSentiment,
      };
    } catch (error) {
      console.error("Get score history error:", error);
      return { success: false, scoreHistory: [] };
    }
  }

  /**
   * Format time from ISO string
   */
  formatTime(isoString) {
    return new Date(isoString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  // ========================================
  // Display helpers (keeps screen free of AI service imports)
  // ========================================

  getSentimentLabel(sentiment) {
    return onDeviceAIService.getSentimentLabel(sentiment);
  }

  getScoreGradient(score) {
    return onDeviceAIService.getScoreGradient(score);
  }

  getScoreColor(score) {
    return onDeviceAIService.getScoreColor(score);
  }

  /**
   * Get display-ready journal summary for a date
   * Returns everything the screen needs without further AI service calls
   */
  getJournalDisplayData(journal) {
    if (!journal) return null;
    const score = journal.currentScore || 50;
    const sentiment = journal.currentSentiment || "neutral";
    return {
      ...journal,
      sentimentLabel: onDeviceAIService.getSentimentLabel(sentiment),
      gradientColors: onDeviceAIService.getScoreGradient(score),
      scoreColor: onDeviceAIService.getScoreColor(score),
    };
  }

  // ========================================
  // Legacy methods for backward compatibility
  // ========================================

  async createEntry(entryData) {
    const { text, mood } = entryData;
    if (text) {
      return await this.addTextEntry(text);
    }
    return { success: false, message: "No content provided" };
  }

  async getEntries(limit = 50) {
    try {
      await this.initialize();
      const journals = await localStorageService.getAllDailyJournals();
      
      // Flatten all logs from all journals
      const allLogs = [];
      for (const journal of journals) {
        if (journal.logs) {
          for (const log of journal.logs) {
            if (!log.deleted) {
              allLogs.push({
                ...log,
                date: journal.date,
              });
            }
          }
        }
      }

      // Sort by timestamp descending
      allLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      return { success: true, entries: allLogs.slice(0, limit) };
    } catch (error) {
      console.error("Get entries error:", error);
      return { success: false, entries: [] };
    }
  }

  async deleteEntry(id) {
    return await this.deleteLog(id);
  }

  async getMoodStats(days = 30) {
    try {
      await this.initialize();
      
      const endDate = this.getTodayDate();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startDateStr = startDate.toISOString().split("T")[0];

      const journals = await this.getJournalsInRange(startDateStr, endDate);
      
      const moodCounts = {};
      const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };

      for (const journal of journals) {
        if (journal.currentSentiment) {
          if (journal.currentSentiment.includes("positive")) {
            sentimentCounts.positive++;
          } else if (journal.currentSentiment.includes("negative")) {
            sentimentCounts.negative++;
          } else {
            sentimentCounts.neutral++;
          }
        }
      }

      return {
        success: true,
        data: { moodCounts, sentimentCounts, totalEntries: journals.length },
      };
    } catch (error) {
      console.error("Mood stats error:", error);
      return { success: false, message: "Failed to get mood statistics" };
    }
  }
}

export default new JournalService();