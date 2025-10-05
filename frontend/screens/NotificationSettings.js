"use client"

import { useState, useEffect } from "react"
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, Alert } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
import DateTimePicker from "@react-native-community/datetimepicker"

import SafeAreaWrapper from "../components/SafeAreaWrapper"
import ResponsiveCard from "../components/ResponsiveCard"
import notificationService from "../services/notificationService"

export default function NotificationSettings({ navigation }) {
  const [settings, setSettings] = useState({
    moodReminders: true,
    journalReminders: true,
    wellnessAlerts: true,
    weeklyReports: true,
    crisisSupport: true, // Always enabled
  })
  const [times, setTimes] = useState({
    moodReminderTime: new Date(2024, 0, 1, 10, 0), // 10:00 AM
    journalReminderTime: new Date(2024, 0, 1, 20, 0), // 8:00 PM
  })
  const [showTimePicker, setShowTimePicker] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const currentSettings = notificationService.getNotificationSettings()
      setSettings(currentSettings)
    } catch (error) {
      console.error("Error loading notification settings:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSettingChange = async (key, value) => {
    try {
      const newSettings = { ...settings, [key]: value }
      setSettings(newSettings)

      const success = await notificationService.updateNotificationSettings(newSettings)

      if (!success) {
        // Revert on failure
        setSettings(settings)
        Alert.alert("Error", "Failed to update notification settings")
      }
    } catch (error) {
      console.error("Error updating setting:", error)
      Alert.alert("Error", "Failed to update notification settings")
    }
  }

  const handleTimeChange = (event, selectedTime, timeType) => {
    setShowTimePicker(null)

    if (selectedTime) {
      setTimes((prev) => ({
        ...prev,
        [timeType]: selectedTime,
      }))

      // Here you would update the actual notification schedule
      // This is a simplified version - in a real app you'd reschedule notifications
    }
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  const notificationTypes = [
    {
      key: "moodReminders",
      title: "Daily Mood Check-ins",
      description: "Gentle reminders to log your daily mood",
      icon: "happy-outline",
      color: "#3b82f6",
      hasTime: true,
      timeKey: "moodReminderTime",
    },
    {
      key: "journalReminders",
      title: "Evening Journal Prompts",
      description: "Reminders to reflect and write in your journal",
      icon: "book-outline",
      color: "#8b5cf6",
      hasTime: true,
      timeKey: "journalReminderTime",
    },
    {
      key: "wellnessAlerts",
      title: "Wellness Alerts",
      description: "Notifications when patterns suggest you might need support",
      icon: "alert-circle-outline",
      color: "#f59e0b",
      hasTime: false,
    },
    {
      key: "weeklyReports",
      title: "Weekly Progress Reports",
      description: "Summary of your wellness journey each week",
      icon: "bar-chart-outline",
      color: "#10b981",
      hasTime: false,
    },
  ]

  if (loading) {
    return (
      <SafeAreaWrapper backgroundColor="#f0f9ff">
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </SafeAreaWrapper>
    )
  }

  return (
    <SafeAreaWrapper backgroundColor="#f0f9ff" statusBarStyle="dark-content">
      <LinearGradient colors={["#f0f9ff", "#e0f2fe"]} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={20} color="#64748b" />
            </TouchableOpacity>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Notification Settings</Text>
              <Text style={styles.headerSubtitle}>Customize your reminders</Text>
            </View>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Privacy Notice */}
          <ResponsiveCard backgroundColor="rgba(16, 185, 129, 0.1)" style={styles.privacyNotice}>
            <View style={styles.privacyHeader}>
              <Ionicons name="shield-checkmark" size={20} color="#059669" />
              <Text style={styles.privacyTitle}>Privacy First</Text>
            </View>
            <Text style={styles.privacyText}>
              All notifications are generated locally on your device. No personal data is sent to external servers.
            </Text>
          </ResponsiveCard>

          {/* Notification Types */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notification Types</Text>

            {notificationTypes.map((type) => (
              <ResponsiveCard key={type.key} style={styles.settingCard}>
                <View style={styles.settingHeader}>
                  <View style={[styles.settingIcon, { backgroundColor: `${type.color}20` }]}>
                    <Ionicons name={type.icon} size={20} color={type.color} />
                  </View>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingTitle}>{type.title}</Text>
                    <Text style={styles.settingDescription}>{type.description}</Text>
                  </View>
                  <Switch
                    value={settings[type.key]}
                    onValueChange={(value) => handleSettingChange(type.key, value)}
                    trackColor={{ false: "#e5e7eb", true: `${type.color}40` }}
                    thumbColor={settings[type.key] ? type.color : "#9ca3af"}
                  />
                </View>

                {/* Time Picker for applicable notifications */}
                {type.hasTime && settings[type.key] && (
                  <View style={styles.timeSetting}>
                    <Text style={styles.timeLabel}>Reminder Time:</Text>
                    <TouchableOpacity style={styles.timeButton} onPress={() => setShowTimePicker(type.timeKey)}>
                      <Ionicons name="time-outline" size={16} color={type.color} />
                      <Text style={[styles.timeText, { color: type.color }]}>{formatTime(times[type.timeKey])}</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ResponsiveCard>
            ))}
          </View>

          {/* Crisis Support Notice */}
          <ResponsiveCard backgroundColor="rgba(254, 242, 242, 0.9)" style={styles.crisisNotice}>
            <View style={styles.crisisHeader}>
              <Ionicons name="medical" size={20} color="#dc2626" />
              <Text style={styles.crisisTitle}>Crisis Support</Text>
            </View>
            <Text style={styles.crisisText}>
              Crisis support notifications are always enabled for your safety and cannot be disabled. These provide
              immediate access to emergency resources when needed.
            </Text>
          </ResponsiveCard>

          {/* Additional Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Options</Text>

            <ResponsiveCard style={styles.settingCard}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  Alert.alert("Test Notification", "Send a test notification to verify your settings?", [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Send Test",
                      onPress: async () => {
                        await notificationService.sendWellnessAlert({
                          title: "Test Notification",
                          message: "This is a test notification from Equilibrium.",
                          severity: "low",
                        })
                        Alert.alert("Test Sent", "Check your notifications!")
                      },
                    },
                  ])
                }}
              >
                <Ionicons name="notifications-outline" size={20} color="#3b82f6" />
                <Text style={styles.actionButtonText}>Send Test Notification</Text>
                <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
              </TouchableOpacity>
            </ResponsiveCard>

            <ResponsiveCard style={styles.settingCard}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  Alert.alert(
                    "Reset Notifications",
                    "This will reset all notification settings to default values. Continue?",
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Reset",
                        style: "destructive",
                        onPress: async () => {
                          const defaultSettings = {
                            moodReminders: true,
                            journalReminders: true,
                            wellnessAlerts: true,
                            weeklyReports: true,
                            crisisSupport: true,
                          }
                          await handleSettingChange("reset", defaultSettings)
                          setSettings(defaultSettings)
                          Alert.alert("Reset Complete", "Notification settings have been reset to defaults.")
                        },
                      },
                    ],
                  )
                }}
              >
                <Ionicons name="refresh-outline" size={20} color="#f59e0b" />
                <Text style={styles.actionButtonText}>Reset to Defaults</Text>
                <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
              </TouchableOpacity>
            </ResponsiveCard>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Time Picker Modals */}
        {showTimePicker && (
          <DateTimePicker
            value={times[showTimePicker]}
            mode="time"
            is24Hour={false}
            display="default"
            onChange={(event, selectedTime) => handleTimeChange(event, selectedTime, showTimePicker)}
          />
        )}
      </LinearGradient>
    </SafeAreaWrapper>
  )
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#6b7280",
    marginTop: 16,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#374151",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6b7280",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  privacyNotice: {
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
  },
  privacyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  privacyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#047857",
  },
  privacyText: {
    fontSize: 14,
    color: "#047857",
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 16,
  },
  settingCard: {
    marginBottom: 12,
    padding: 16,
  },
  settingHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 18,
  },
  timeSetting: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  timeLabel: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  timeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#f9fafb",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  timeText: {
    fontSize: 14,
    fontWeight: "600",
  },
  crisisNotice: {
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(220, 38, 38, 0.2)",
  },
  crisisHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  crisisTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#dc2626",
  },
  crisisText: {
    fontSize: 14,
    color: "#dc2626",
    lineHeight: 20,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 4,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    color: "#374151",
    fontWeight: "500",
  },
})
