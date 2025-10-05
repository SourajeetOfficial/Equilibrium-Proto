"use client"

import { useState } from "react"
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import SafeAreaWrapper from "../components/SafeAreaWrapper"

export default function SettingsScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: false,
    biometricAuth: false,
  })

  const handleSettingChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
    // Here you would typically save to AsyncStorage or API
  }

  const settingsGroups = [
    {
      title: "Notifications",
      items: [
        {
          key: "notifications",
          title: "Push Notifications",
          subtitle: "Receive wellness reminders",
          type: "switch",
          value: settings.notifications,
        },
      ],
    },
    {
      title: "Appearance",
      items: [
        {
          key: "darkMode",
          title: "Dark Mode",
          subtitle: "Use dark theme",
          type: "switch",
          value: settings.darkMode,
        },
      ],
    },
    {
      title: "Security",
      items: [
        {
          key: "biometricAuth",
          title: "Biometric Authentication",
          subtitle: "Use fingerprint or face ID",
          type: "switch",
          value: settings.biometricAuth,
        },
      ],
    },
    {
      title: "Data & Privacy",
      items: [
        {
          key: "privacySettings",
          title: "Privacy & Data",
          subtitle: "Manage your consent and data rights",
          type: "action",
          onPress: () => navigation.navigate("PrivacySettings"),
        },
      ],
    },
    {
      title: "Support",
      items: [
        {
          key: "helpCenter",
          title: "Help Center",
          subtitle: "Find answers and contact support",
          type: "action",
          onPress: () => navigation.navigate("HelpCenter"),
        },
        {
          key: "about",
          title: "About",
          subtitle: "App version and info",
          type: "action",
          onPress: () => navigation.navigate("About"),
        },
      ],
    },
  ]

  return (
    <SafeAreaWrapper backgroundColor="#dbeafe" statusBarStyle="dark-content">
      <LinearGradient colors={["#f8fafc", "#f1f5f9"]} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={20} color="#64748b" />
            </TouchableOpacity>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Settings</Text>
              <Text style={styles.headerSubtitle}>Customize your experience</Text>
            </View>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {settingsGroups.map((group, groupIndex) => (
            <View key={groupIndex} style={styles.settingsGroup}>
              <Text style={styles.groupTitle}>{group.title}</Text>
              <View style={styles.groupCard}>
                {group.items.map((item, itemIndex) => (
                  <View
                    key={item.key}
                    style={[styles.settingItem, itemIndex === group.items.length - 1 && { borderBottomWidth: 0 }]}
                  >
                    <View style={styles.settingText}>
                      <Text style={styles.settingTitle}>{item.title}</Text>
                      <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
                    </View>
                    {item.type === "switch" ? (
                      <Switch
                        value={item.value}
                        onValueChange={(value) => handleSettingChange(item.key, value)}
                        trackColor={{ false: "#e5e7eb", true: "#10b981" }}
                      />
                    ) : (
                      <TouchableOpacity style={styles.actionButton} onPress={item.onPress}>
                        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            </View>
          ))}
          <View style={{ height: 100 }} />
        </ScrollView>
      </LinearGradient>
    </SafeAreaWrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
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
    fontWeight: "300",
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
  settingsGroup: {
    marginBottom: 24,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 12,
  },
  groupCard: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 12,
    color: "#6b7280",
  },
  actionButton: {
    padding: 4,
  },
})