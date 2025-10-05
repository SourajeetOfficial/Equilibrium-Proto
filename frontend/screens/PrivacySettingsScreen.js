"use client"

import { useState, useEffect } from "react"
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, Alert, Modal, TextInput, ActivityIndicator, Dimensions } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import SafeAreaWrapper from "../components/SafeAreaWrapper"
import ResponsiveCard from "../components/ResponsiveCard"
import consentService from "../services/consentService"
import dataPortabilityService from "../services/dataPortabilityService"
import authService from "../services/authService"

const { width: screenWidth } = Dimensions.get("window")
const isTablet = screenWidth > 768

export default function PrivacySettingsScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const [consentFlags, setConsentFlags] = useState({})
  const [loading, setLoading] = useState(false)
  const [dataSummary, setDataSummary] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletePassword, setDeletePassword] = useState("")
  const [showConsentModal, setShowConsentModal] = useState(false)
  const [selectedConsent, setSelectedConsent] = useState(null)

  useEffect(() => {
    initializePrivacySettings()
  }, [])

  const initializePrivacySettings = async () => {
    setLoading(true)
    try {
      const user = authService.getCurrentUser()
      if (user) {
        await consentService.initialize(user.id)
        setConsentFlags(consentService.getConsentFlags())
        
        const summary = await dataPortabilityService.getDataSummary(user.id)
        setDataSummary(summary)
      }
    } catch (error) {
      console.error("Error initializing privacy settings:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleConsentChange = async (flagName, value) => {
    if (value) {
      // Show detailed consent modal when enabling
      setSelectedConsent(flagName)
      setShowConsentModal(true)
    } else {
      // Directly disable when turning off
      await updateConsent(flagName, false)
    }
  }
  
  const updateConsent = async (flagName, value) => {
    setLoading(true)
    try {
      const user = authService.getCurrentUser()
      const result = await consentService.updateConsent(user.id, flagName, value)
      
      if (result.success) {
        setConsentFlags(consentService.getConsentFlags())
        Alert.alert(
          "Settings Updated",
          value
            ? "Your consent has been recorded and saved securely."
            : "Your consent has been withdrawn. Related data sharing has been disabled."
        )
      } else {
        Alert.alert("Error", result.error || "Failed to update consent settings")
      }
    } catch (error) {
      console.error("Error updating consent:", error)
      Alert.alert("Error", "Failed to update consent settings")
    } finally {
      setLoading(false)
      setShowConsentModal(false)
      setSelectedConsent(null)
    }
  }

  const handleExportData = async () => {
    Alert.alert(
      "Export Your Data",
      "This will create a comprehensive export of all your data including journal entries, wellness metrics, and settings. The file will be encrypted and can be saved or shared.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Export",
          onPress: async () => {
            setLoading(true)
            try {
              const user = authService.getCurrentUser()
              const result = await dataPortabilityService.exportAllData(user.id)

              if (result.success) {
                Alert.alert("Export Complete", `Your data has been exported successfully. File: ${result.fileName}`)
              } else {
                Alert.alert("Export Failed", result.error)
              }
            } catch (error) {
              Alert.alert("Export Failed", "An error occurred while exporting your data.")
            } finally {
              setLoading(false)
            }
          },
        },
      ]
    )
  }

  const handleImportData = async () => {
    Alert.alert(
      "Import Data",
      "Select a previously exported Equilibrium data file to restore your information. This will merge with your existing data.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Select File",
          onPress: async () => {
            setLoading(true)
            try {
              const result = await dataPortabilityService.importData()

              if (result.success) {
                Alert.alert("Import Complete", result.message, [
                  { text: "OK", onPress: () => initializePrivacySettings() },
                ])
              } else if (!result.cancelled) {
                Alert.alert("Import Failed", result.error)
              }
            } catch (error) {
              Alert.alert("Import Failed", "An error occurred while importing data.")
            } finally {
              setLoading(false)
            }
          },
        },
      ]
    )
  }

  const handleClearServerData = async () => {
    Alert.alert(
      "Clear Server Data",
      "This will permanently delete all your data from our servers while keeping your local data intact. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear Server Data",
          style: "destructive",
          onPress: async () => {
            setLoading(true)
            try {
              const user = authService.getCurrentUser()
              const result = await dataPortabilityService.deleteAllLocalData(user.id)

              if (result) {
                Alert.alert("Server Data Cleared", "All your server data has been permanently deleted.")
              } else {
                Alert.alert("Clear Failed", "Failed to clear server data.")
              }
            } catch (error) {
              Alert.alert("Clear Failed", "An error occurred while clearing server data.")
            } finally {
              setLoading(false)
            }
          },
        },
      ]
    )
  }

  const handleDeleteAccount = () => {
    setShowDeleteModal(true)
  }

  const confirmDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      Alert.alert("Password Required", "Please enter your password to confirm account deletion.")
      return
    }

    setLoading(true)
    try {
      const user = authService.getCurrentUser()
      const result = await dataPortabilityService.deleteAllData(user.id, deletePassword)

      if (result.success) {
        Alert.alert("Account Deleted", "Your account and all associated data have been permanently deleted.", [
          {
            text: "OK",
            onPress: () => {
              setShowDeleteModal(false)
              
              // The auth service will handle logout and navigation
            },
          },
        ])
      } else {
        Alert.alert("Delete Failed", result.error)
      }
    } catch (error) {
      Alert.alert("Delete Failed", "An error occurred while deleting your account.")
    } finally {
      setLoading(false)
      setDeletePassword("")
    }
  }

  const privacySettings = [
    {
      key: "usageTracking",
      title: "Usage Analytics",
      subtitle: "Share anonymized wellness metrics to improve services",
      icon: "analytics-outline",
      value: consentFlags.usageTracking || false,
    },
    {
      key: "cloudSync",
      title: "Cloud Backup",
      subtitle: "Encrypted backup of aggregated data only",
      icon: "cloud-outline",
      value: consentFlags.cloudSync || false,
    },
    {
      key: "emergencyContacts",
      title: "Emergency Contacts",
      subtitle: "Store emergency contacts with end-to-end encryption",
      icon: "people-outline",
      value: consentFlags.emergencyContacts || false,
    },
    {
      key: "anonymousAnalytics",
      title: "Anonymous Analytics",
      subtitle: "Help improve the app with usage statistics",
      icon: "bar-chart-outline",
      value: consentFlags.anonymousAnalytics || false,
    },
    {
      key: "crashReporting",
      title: "Crash Reporting",
      subtitle: "Automatically send crash reports for bug fixes",
      icon: "bug-outline",
      value: consentFlags.crashReporting || false,
    },
  ]

  return (
    <SafeAreaWrapper backgroundColor="#f8fafc" statusBarStyle="dark-content">
      <LinearGradient colors={["#f8fafc", "#f1f5f9"]} style={styles.gradient}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: 10 }]}>
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={22} color="#64748b" />
            </TouchableOpacity>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Privacy & Data</Text>
              <Text style={styles.headerSubtitle}>Control your data and privacy</Text>
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 100, 120) }]}
        >
          {/* Privacy Principles */}
          <ResponsiveCard backgroundColor="rgba(16, 185, 129, 0.05)" style={styles.principlesCard}>
            <View style={styles.principlesHeader}>
              <Ionicons name="shield-checkmark" size={24} color="#059669" />
              <Text style={styles.principlesTitle}>Privacy First</Text>
            </View>
            <Text style={styles.principlesText}>
              Your privacy is our foundation. All sensitive data processing happens on your device. You control what
              data, if any, is shared with our servers.
            </Text>
          </ResponsiveCard>

          {/* Data Summary */}
          {dataSummary && (
            <ResponsiveCard style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Your Data Summary</Text>
              <View style={styles.summaryGrid}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryNumber}>{dataSummary.journalEntries}</Text>
                  <Text style={styles.summaryLabel}>Journal Entries</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryNumber}>{dataSummary.wellnessDataPoints}</Text>
                  <Text style={styles.summaryLabel}>Wellness Data Points</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryNumber}>{dataSummary.closeContacts}</Text>
                  <Text style={styles.summaryLabel}>Close Contacts</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryNumber}>{dataSummary.totalStorageUsed}KB</Text>
                  <Text style={styles.summaryLabel}>Storage Used</Text>
                </View>
              </View>
            </ResponsiveCard>
          )}

          {/* Consent Settings */}
          <View style={styles.settingsGroup}>
            <Text style={styles.groupTitle}>Data Sharing Consent</Text>
            <ResponsiveCard style={styles.groupCard}>
              {privacySettings.map((setting, index) => (
                <View
                  key={setting.key}
                  style={[styles.settingItem, index === privacySettings.length - 1 && { borderBottomWidth: 0 }]}
                >
                  <View style={styles.settingIcon}>
                    <Ionicons name={setting.icon} size={20} color="#6b7280" />
                  </View>
                  <View style={styles.settingText}>
                    <Text style={styles.settingTitle}>{setting.title}</Text>
                    <Text style={styles.settingSubtitle}>{setting.subtitle}</Text>
                  </View>
                  <Switch
                    value={setting.value}
                    onValueChange={(value) => handleConsentChange(setting.key, value)}
                    trackColor={{ false: "#e5e7eb", true: "#10b981" }}
                    thumbColor="#ffffff"
                    disabled={loading}
                  />
                </View>
              ))}
            </ResponsiveCard>
          </View>

          {/* Data Rights */}
          <View style={styles.settingsGroup}>
            <Text style={styles.groupTitle}>Your Data Rights</Text>
            <ResponsiveCard style={styles.groupCard}>
              <TouchableOpacity
                style={styles.actionItem}
                onPress={handleExportData}
                disabled={loading}
                activeOpacity={0.7}
              >
                <View style={styles.actionIcon}>
                  <Ionicons name="download-outline" size={20} color="#3b82f6" />
                </View>
                <View style={styles.actionText}>
                  <Text style={styles.actionTitle}>Export My Data</Text>
                  <Text style={styles.actionSubtitle}>Download all your data in a portable format</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionItem}
                onPress={handleImportData}
                disabled={loading}
                activeOpacity={0.7}
              >
                <View style={styles.actionIcon}>
                  <Ionicons name="cloud-upload-outline" size={20} color="#8b5cf6" />
                </View>
                <View style={styles.actionText}>
                  <Text style={styles.actionTitle}>Import Data</Text>
                  <Text style={styles.actionSubtitle}>Restore data from a previous export</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionItem}
                onPress={handleClearServerData}
                disabled={loading}
                activeOpacity={0.7}
              >
                <View style={styles.actionIcon}>
                  <Ionicons name="server-outline" size={20} color="#f59e0b" />
                </View>
                <View style={styles.actionText}>
                  <Text style={styles.actionTitle}>Clear Server Data</Text>
                  <Text style={styles.actionSubtitle}>Delete all data from our servers</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionItem, { borderBottomWidth: 0 }]}
                onPress={handleDeleteAccount}
                disabled={loading}
                activeOpacity={0.7}
              >
                <View style={styles.actionIcon}>
                  <Ionicons name="trash-outline" size={20} color="#ef4444" />
                </View>
                <View style={styles.actionText}>
                  <Text style={[styles.actionTitle, { color: "#ef4444" }]}>Delete Account</Text>
                  <Text style={styles.actionSubtitle}>Permanently delete your account and all data</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </TouchableOpacity>
            </ResponsiveCard>
          </View>

          {/* Local Data Info */}
          <ResponsiveCard backgroundColor="rgba(59, 130, 246, 0.05)" style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Ionicons name="phone-portrait" size={20} color="#6b7280" />
              <Text style={styles.infoTitle}>Local Data Storage</Text>
            </View>
            <Text style={styles.infoText}>
              Your journal entries, close contacts, and raw wellness data are stored encrypted on your device only. This
              data never leaves your device unless you explicitly choose to export it.
            </Text>
          </ResponsiveCard>
        </ScrollView>

        {/* Loading Overlay */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text style={styles.loadingText}>Processing...</Text>
            </View>
          </View>
        )}

        {/* Consent Detail Modal */}
        <Modal
          visible={showConsentModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowConsentModal(false)}
        >
          <SafeAreaWrapper backgroundColor="#ffffff">
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowConsentModal(false)} activeOpacity={0.7}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Data Consent</Text>
              <TouchableOpacity onPress={() => updateConsent(selectedConsent, true)} activeOpacity={0.7}>
                <Text style={styles.modalConfirm}>I Consent</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {selectedConsent && (
                <View>
                  <Text style={styles.consentTitle}>{consentService.getConsentDescription(selectedConsent).title}</Text>
                  <Text style={styles.consentDescription}>
                    {consentService.getConsentDescription(selectedConsent).description}
                  </Text>
                  <Text style={styles.consentDetails}>
                    {consentService.getConsentDescription(selectedConsent).details}
                  </Text>

                  <View style={styles.consentHighlights}>
                    <View style={styles.highlightItem}>
                      <Ionicons name="checkmark-circle" size={20} color="#059669" />
                      <Text style={styles.highlightText}>You can withdraw consent at any time</Text>
                    </View>
                    <View style={styles.highlightItem}>
                      <Ionicons name="shield-checkmark" size={20} color="#059669" />
                      <Text style={styles.highlightText}>All data is encrypted and anonymized</Text>
                    </View>
                    <View style={styles.highlightItem}>
                      <Ionicons name="eye-off" size={20} color="#059669" />
                      <Text style={styles.highlightText}>No personal content is ever shared</Text>
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>
          </SafeAreaWrapper>
        </Modal>

        {/* Delete Account Modal */}
        <Modal
          visible={showDeleteModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowDeleteModal(false)}
        >
          <SafeAreaWrapper backgroundColor="#ffffff">
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowDeleteModal(false)} activeOpacity={0.7}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Delete Account</Text>
              <TouchableOpacity
                onPress={confirmDeleteAccount}
                disabled={!deletePassword.trim() || loading}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalDelete, (!deletePassword.trim() || loading) && styles.modalDeleteDisabled]}>
                  Delete
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.deleteWarning}>
                <Ionicons name="warning" size={48} color="#ef4444" />
                <Text style={styles.deleteWarningTitle}>This action cannot be undone</Text>
                <Text style={styles.deleteWarningText}>
                  Deleting your account will permanently remove all your data from our servers and your device. This
                  includes your journal entries, wellness data, contacts, and all settings.
                </Text>
              </View>

              <View style={styles.passwordContainer}>
                <Text style={styles.passwordLabel}>Enter your password to confirm:</Text>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Password"
                  placeholderTextColor="#9ca3af"
                  value={deletePassword}
                  onChangeText={setDeletePassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.deleteChecklist}>
                <Text style={styles.checklistTitle}>Before you delete:</Text>
                <View style={styles.checklistItem}>
                  <Ionicons name="download-outline" size={16} color="#6b7280" />
                  <Text style={styles.checklistText}>Export your data if you want to keep it</Text>
                </View>
                <View style={styles.checklistItem}>
                  <Ionicons name="people-outline" size={16} color="#6b7280" />
                  <Text style={styles.checklistText}>Inform your emergency contacts if needed</Text>
                </View>
                <View style={styles.checklistItem}>
                  <Ionicons name="time-outline" size={16} color="#6b7280" />
                  <Text style={styles.checklistText}>Consider taking a break instead of deleting</Text>
                </View>
              </View>
            </ScrollView>
          </SafeAreaWrapper>
        </Modal>
      </LinearGradient>
    </SafeAreaWrapper>
  )
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: isTablet ? 28 : 24,
    fontWeight: "700",
    color: "#374151",
  },
  headerSubtitle: {
    fontSize: isTablet ? 18 : 16,
    color: "#6b7280",
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  principlesCard: {
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.1)",
  },
  principlesHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  principlesTitle: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: "600",
    color: "#374151",
  },
  principlesText: {
    fontSize: isTablet ? 16 : 14,
    color: "#6b7280",
    lineHeight: 22,
  },
  summaryCard: {
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  summaryItem: {
    flex: 1,
    minWidth: "45%",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 8,
  },
  summaryNumber: {
    fontSize: isTablet ? 24 : 20,
    fontWeight: "700",
    color: "#3b82f6",
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: isTablet ? 14 : 12,
    color: "#6b7280",
    textAlign: "center",
  },
  settingsGroup: {
    marginBottom: 24,
  },
  groupTitle: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  groupCard: {
    padding: 0,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  settingIcon: {
    width: 40,
    height: 40,
    backgroundColor: "#f8fafc",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  settingText: {
    flex: 1,
    marginRight: 12,
  },
  settingTitle: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: isTablet ? 15 : 13,
    color: "#6b7280",
    lineHeight: 18,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  actionIcon: {
    width: 40,
    height: 40,
    backgroundColor: "#f8fafc",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: isTablet ? 15 : 13,
    color: "#6b7280",
    lineHeight: 18,
  },
  infoCard: {
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.1)",
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: "500",
    color: "#374151",
  },
  infoText: {
    fontSize: isTablet ? 16 : 14,
    color: "#6b7280",
    lineHeight: 22,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loadingText: {
    fontSize: isTablet ? 18 : 16,
    color: "#374151",
    marginTop: 12,
    fontWeight: "500",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalCancel: {
    fontSize: isTablet ? 18 : 16,
    color: "#6b7280",
  },
  modalTitle: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: "600",
    color: "#374151",
  },
  modalConfirm: {
    fontSize: isTablet ? 18 : 16,
    color: "#3b82f6",
    fontWeight: "500",
  },
  modalDelete: {
    fontSize: isTablet ? 18 : 16,
    color: "#ef4444",
    fontWeight: "500",
  },
  modalDeleteDisabled: {
    color: "#9ca3af",
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  consentTitle: {
    fontSize: isTablet ? 24 : 20,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 16,
  },
  consentDescription: {
    fontSize: isTablet ? 18 : 16,
    color: "#374151",
    lineHeight: 24,
    marginBottom: 16,
  },
  consentDetails: {
    fontSize: isTablet ? 16 : 14,
    color: "#6b7280",
    lineHeight: 22,
    marginBottom: 24,
  },
  consentHighlights: {
    gap: 16,
  },
  highlightItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  highlightText: {
    fontSize: isTablet ? 16 : 14,
    color: "#374151",
    flex: 1,
  },
  deleteWarning: {
    alignItems: "center",
    marginBottom: 32,
  },
  deleteWarningTitle: {
    fontSize: isTablet ? 24 : 20,
    fontWeight: "600",
    color: "#ef4444",
    marginTop: 16,
    marginBottom: 12,
  },
  deleteWarningText: {
    fontSize: isTablet ? 16 : 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 22,
  },
  passwordContainer: {
    marginBottom: 32,
  },
  passwordLabel: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 12,
  },
  passwordInput: {
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 16,
    fontSize: isTablet ? 18 : 16,
    color: "#374151",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  deleteChecklist: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 16,
  },
  checklistTitle: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 12,
  },
  checklistItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  checklistText: {
    fontSize: isTablet ? 16 : 14,
    color: "#6b7280",
    flex: 1,
  },
})