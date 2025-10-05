import AsyncStorage from "@react-native-async-storage/async-storage"
import { Alert } from "react-native"
import authService from "./authService"
import api from "../config/api"

class DataPrivacyService {
  // Show privacy warning when user tries to delete app data
  async showDataDeletionWarning() {
    return new Promise((resolve) => {
      Alert.alert(
        "⚠️ Data Privacy Warning",
        "Your personal data will be lost forever if you delete the app data. If you want to save your data securely in our encrypted database, we can help you backup your information.\n\n🔒 Your privacy is our priority - all data is encrypted and only you can access it.",
        [
          {
            text: "Delete Locally Only",
            style: "destructive",
            onPress: () => resolve("local"),
          },
          {
            text: "Backup to Secure Database",
            onPress: () => resolve("backup"),
          },
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => resolve("cancel"),
          },
        ],
        { cancelable: false },
      )
    })
  }

  // Backup local data to encrypted database
  async backupLocalData() {
    try {
      const localJournalData = await AsyncStorage.getItem("localJournalData")
      const localMoodData = await AsyncStorage.getItem("localMoodData")
      const localUsageData = await AsyncStorage.getItem("localUsageData")

      if (!authService.isAuthenticated()) {
        throw new Error("User must be logged in to backup data")
      }

      const backupPromises = []

      // Backup journal entries
      if (localJournalData) {
        const journals = JSON.parse(localJournalData)
        for (const journal of journals) {
          backupPromises.push(
            api.post("/journals", {
              text: journal.text,
              mood: journal.mood,
              timestamp: journal.timestamp,
            }),
          )
        }
      }

      // Backup mood data
      if (localMoodData) {
        const moods = JSON.parse(localMoodData)
        for (const mood of moods) {
          backupPromises.push(
            api.post("/usage", {
              type: "mood",
              startTime: mood.timestamp,
              endTime: mood.timestamp,
              metadata: { mood: mood.value, notes: mood.notes },
            }),
          )
        }
      }

      // Backup usage data
      if (localUsageData) {
        const usageEntries = JSON.parse(localUsageData)
        for (const entry of usageEntries) {
          backupPromises.push(api.post("/usage", entry))
        }
      }

      await Promise.all(backupPromises)

      Alert.alert(
        "✅ Backup Complete",
        "Your data has been securely encrypted and backed up to our database. You can now safely delete local data.",
        [{ text: "OK" }],
      )

      return { success: true }
    } catch (error) {
      console.error("Backup error:", error)
      Alert.alert("❌ Backup Failed", "There was an error backing up your data. Please try again or contact support.", [
        { text: "OK" },
      ])
      return { success: false, error: error.message }
    }
  }

  // Clear local data with privacy options
  async clearLocalData() {
    const choice = await this.showDataDeletionWarning()

    switch (choice) {
      case "backup":
        const backupResult = await this.backupLocalData()
        if (backupResult.success) {
          await this.performLocalDataClear()
        }
        break

      case "local":
        await this.performLocalDataClear()
        Alert.alert(
          "🗑️ Local Data Cleared",
          "Your local data has been deleted. Your account and any previously backed up data remains secure in our database.",
          [{ text: "OK" }],
        )
        break

      case "cancel":
        return false
    }

    return true
  }

  // Actually perform the local data clearing
  async performLocalDataClear() {
    try {
      const keysToRemove = [
        "localJournalData",
        "localMoodData",
        "localUsageData",
        "localEmergencyContacts",
        "appPreferences",
      ]

      await AsyncStorage.multiRemove(keysToRemove)
      return true
    } catch (error) {
      console.error("Local data clear error:", error)
      return false
    }
  }

  // Store data locally with encryption awareness
  async storeLocalData(key, data) {
    try {
      const dataWithTimestamp = {
        ...data,
        localTimestamp: new Date().toISOString(),
        encrypted: false, // Mark as local, unencrypted data
      }

      await AsyncStorage.setItem(key, JSON.stringify(dataWithTimestamp))
      return true
    } catch (error) {
      console.error("Local storage error:", error)
      return false
    }
  }

  // Get local data
  async getLocalData(key) {
    try {
      const data = await AsyncStorage.getItem(key)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error("Local data retrieval error:", error)
      return null
    }
  }

  // Sync local data with server
  async syncWithServer() {
    if (!authService.isAuthenticated()) {
      return { success: false, message: "User not authenticated" }
    }

    try {
      // Get server data
      const [journalsResponse, usageResponse] = await Promise.all([
        api.get("/journals?limit=100"),
        api.get("/usage?limit=100"),
      ])

      // Store server data locally for offline access
      await AsyncStorage.setItem("serverJournalData", JSON.stringify(journalsResponse.data))
      await AsyncStorage.setItem("serverUsageData", JSON.stringify(usageResponse.data))

      return { success: true }
    } catch (error) {
      console.error("Sync error:", error)
      return { success: false, error: error.message }
    }
  }
}

export default new DataPrivacyService()
