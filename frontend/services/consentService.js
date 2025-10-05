import AsyncStorage from "@react-native-async-storage/async-storage"
import authService from "./authService"

class ConsentService {
  constructor() {
    this.consentFlags = {
      usageTracking: false,
      cloudSync: false,
      emergencyContacts: false,
      anonymousAnalytics: false,
      crashReporting: false,
    }
    this.initialized = false
  }

  async initialize(userId) {
    try {
      const stored = await AsyncStorage.getItem(`consent_${userId}`)
      if (stored) {
        this.consentFlags = { ...this.consentFlags, ...JSON.parse(stored) }
      }
      this.initialized = true
      return true
    } catch (error) {
      console.error("Failed to initialize consent service:", error)
      return false
    }
  }

  getConsentFlags() {
    return { ...this.consentFlags }
  }

  async updateConsent(userId, flagName, value) {
    try {
      this.consentFlags[flagName] = value

      // Save locally
      await AsyncStorage.setItem(`consent_${userId}`, JSON.stringify(this.consentFlags))

      // Sync with backend if user consents to cloud sync
      if (this.consentFlags.cloudSync) {
        const result = await authService.updateConsent({ [flagName]: value })
        if (!result.success) {
          console.warn("Failed to sync consent with backend:", result.error)
        }
      }

      return { success: true }
    } catch (error) {
      console.error("Failed to update consent:", error)
      return { success: false, error: error.message }
    }
  }

  hasConsent(flagName) {
    return this.consentFlags[flagName] === true
  }

  getConsentDescription(flagName) {
    const descriptions = {
      usageTracking: {
        title: "Usage Analytics",
        description: "Share anonymized wellness metrics to help improve our services and research.",
        details:
          "This includes aggregated data like wellness scores, mood trends, and usage patterns. No personal content from your journal entries is ever shared. All data is anonymized and encrypted before transmission.",
      },
      cloudSync: {
        title: "Cloud Backup",
        description: "Enable encrypted backup of your aggregated wellness data to the cloud.",
        details:
          "Only processed wellness metrics are backed up - never your raw journal entries or personal information. All data is encrypted with your device key before upload. You can disable this at any time.",
      },
      emergencyContacts: {
        title: "Emergency Contacts",
        description: "Store your emergency contacts with end-to-end encryption on our servers.",
        details:
          "Your emergency contacts are encrypted with a key only you possess. This enables crisis intervention features while maintaining your privacy. Contacts are never shared with third parties.",
      },
      anonymousAnalytics: {
        title: "Anonymous Analytics",
        description: "Help improve the app by sharing anonymous usage statistics.",
        details:
          "This includes information like which features are used most, app performance metrics, and general usage patterns. No personal data or content is included in these analytics.",
      },
      crashReporting: {
        title: "Crash Reporting",
        description: "Automatically send crash reports to help us fix bugs and improve stability.",
        details:
          "When the app crashes, technical information about the error is sent to help us identify and fix problems. No personal data or journal content is included in crash reports.",
      },
    }

    return (
      descriptions[flagName] || {
        title: "Unknown Setting",
        description: "No description available",
        details: "No additional details available",
      }
    )
  }

  async revokeAllConsent(userId) {
    try {
      // Reset all flags to false
      Object.keys(this.consentFlags).forEach((key) => {
        this.consentFlags[key] = false
      })

      // Save locally
      await AsyncStorage.setItem(`consent_${userId}`, JSON.stringify(this.consentFlags))

      // Notify backend
      const result = await authService.updateConsent(this.consentFlags)

      return { success: true }
    } catch (error) {
      console.error("Failed to revoke all consent:", error)
      return { success: false, error: error.message }
    }
  }

  async clearConsentData(userId) {
    try {
      await AsyncStorage.removeItem(`consent_${userId}`)
      this.consentFlags = {
        usageTracking: false,
        cloudSync: false,
        emergencyContacts: false,
        anonymousAnalytics: false,
        crashReporting: false,
      }
      return true
    } catch (error) {
      console.error("Failed to clear consent data:", error)
      return false
    }
  }
}

export default new ConsentService()
