import * as DocumentPicker from "expo-document-picker"
import * as FileSystem from "expo-file-system"
import * as Sharing from "expo-sharing"
import localStorageService from "./localStorageService"
import authService from "./authService"
import AsyncStorage from "@react-native-async-storage/async-storage"

class DataPortabilityService {
  async getDataSummary(userId) {
    try {
      const stats = await localStorageService.getStorageStats()

      // Calculate storage size (rough estimate)
      const journalEntries = await localStorageService.getJournalEntries()
      const wellnessData = await localStorageService.getWellnessData()
      const contacts = await localStorageService.getCloseContacts()

      const totalStorageUsed = Math.round(
        (JSON.stringify(journalEntries).length +
          JSON.stringify(wellnessData).length +
          JSON.stringify(contacts).length) /
          1024,
      )

      return {
        journalEntries: stats.journalEntries,
        wellnessDataPoints: stats.wellnessDataPoints,
        closeContacts: stats.closeContacts,
        totalStorageUsed,
      }
    } catch (error) {
      console.error("Error getting data summary:", error)
      return {
        journalEntries: 0,
        wellnessDataPoints: 0,
        closeContacts: 0,
        totalStorageUsed: 0,
      }
    }
  }

  async exportAllData(userId) {
    try {
      const user = authService.getCurrentUser()

      // Gather all local data
      const journalEntries = await localStorageService.getJournalEntries()
      const wellnessData = await localStorageService.getWellnessData()
      const contacts = await localStorageService.getCloseContacts()
      const appUsage = await localStorageService.getAppUsage(30)

      // Create export object
      const exportData = {
        exportInfo: {
          userId: userId,
          userEmail: user?.email,
          exportDate: new Date().toISOString(),
          version: "1.0",
          appVersion: "1.0.0",
        },
        journalEntries: journalEntries.map((entry) => ({
          id: entry.id,
          content: entry.content,
          moodScore: entry.mood_score,
          sentimentLabel: entry.sentiment_label,
          timestamp: entry.timestamp,
          date: new Date(entry.timestamp).toISOString(),
        })),
        wellnessData: wellnessData.map((data) => ({
          date: data.date,
          sleepHours: data.sleep_hours,
          moodScore: data.mood_score,
          screenTimeMinutes: data.screen_time_minutes,
          activityMinutes: data.activity_minutes,
          wellnessScore: data.wellness_score,
        })),
        closeContacts: contacts.map((contact) => ({
          id: contact.id,
          name: contact.name,
          phone: contact.phone,
          relationship: contact.relationship,
          isEmergency: contact.is_emergency,
        })),
        appUsage: appUsage.map((usage) => ({
          date: usage.date,
          pickupCount: usage.pickup_count,
          totalScreenTime: usage.total_screen_time,
          sessionData: usage.session_data,
        })),
      }

      // Create filename with timestamp
      const timestamp = new Date().toISOString().split("T")[0]
      const fileName = `equilibrium_export_${timestamp}.json`
      const filePath = `${FileSystem.documentDirectory}${fileName}`

      // Write to file
      await FileSystem.writeAsStringAsync(filePath, JSON.stringify(exportData, null, 2), {
        encoding: FileSystem.EncodingType.UTF8,
      })

      // Share the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, {
          mimeType: "application/json",
          dialogTitle: "Export Equilibrium Data",
        })
      }

      return {
        success: true,
        fileName,
        filePath,
        recordCount: {
          journalEntries: journalEntries.length,
          wellnessData: wellnessData.length,
          contacts: contacts.length,
          appUsage: appUsage.length,
        },
      }
    } catch (error) {
      console.error("Export error:", error)
      return {
        success: false,
        error: error.message,
      }
    }
  }

  async importData() {
    try {
      // Pick file
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/json",
        copyToCacheDirectory: true,
      })

      if (result.canceled) {
        return { success: false, cancelled: true }
      }

      // Read file content
      const fileContent = await FileSystem.readAsStringAsync(result.assets[0].uri)
      const importData = JSON.parse(fileContent)

      // Validate import data structure
      if (!importData.exportInfo || !importData.exportInfo.version) {
        throw new Error("Invalid export file format")
      }

      let importedCount = 0

      // Import journal entries
      if (importData.journalEntries && Array.isArray(importData.journalEntries)) {
        for (const entry of importData.journalEntries) {
          await localStorageService.saveJournalEntry(entry.content, entry.moodScore, entry.sentimentLabel)
          importedCount++
        }
      }

      // Import wellness data
      if (importData.wellnessData && Array.isArray(importData.wellnessData)) {
        for (const data of importData.wellnessData) {
          await localStorageService.saveWellnessData(data.date, {
            sleepHours: data.sleepHours,
            moodScore: data.moodScore,
            screenTimeMinutes: data.screenTimeMinutes,
            activityMinutes: data.activityMinutes,
            wellnessScore: data.wellnessScore,
          })
          importedCount++
        }
      }

      // Import close contacts
      if (importData.closeContacts && Array.isArray(importData.closeContacts)) {
        for (const contact of importData.closeContacts) {
          await localStorageService.saveCloseContact(
            contact.name,
            contact.phone,
            contact.relationship,
            contact.isEmergency,
          )
          importedCount++
        }
      }

      return {
        success: true,
        message: `Successfully imported ${importedCount} records from ${importData.exportInfo.exportDate}`,
        importedCount,
      }
    } catch (error) {
      console.error("Import error:", error)
      return {
        success: false,
        error: error.message,
      }
    }
  }

  async deleteAllLocalData(userId) {
    try {
      await localStorageService.clearAllData()
      return true
    } catch (error) {
      console.error("Error deleting local data:", error)
      return false
    }
  }

  async deleteAllData(userId, password) {
    try {
      // Verify password with backend
      const user = authService.getCurrentUser()
      const deleteResult = await authService.deleteAccount(password)

      if (deleteResult.success) {
        // Clear all local data
        await localStorageService.clearAllData()

        // Clear other app data
        await this.clearAllAppData(userId)

        return { success: true }
      } else {
        return { success: false, error: deleteResult.error }
      }
    } catch (error) {
      console.error("Error deleting all data:", error)
      return { success: false, error: error.message }
    }
  }

  async clearAllAppData(userId) {
    try {
      // Clear all AsyncStorage data related to the user
      const keys = await AsyncStorage.getAllKeys()
      const userKeys = keys.filter((key) => key.includes(userId) || key.includes("equilibrium"))

      if (userKeys.length > 0) {
        await AsyncStorage.multiRemove(userKeys)
      }

      return true
    } catch (error) {
      console.error("Error clearing app data:", error)
      return false
    }
  }
}

export default new DataPortabilityService()
