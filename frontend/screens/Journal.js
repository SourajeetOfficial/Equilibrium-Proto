"use client"

import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  Modal,
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
import { useState, useEffect } from "react"
import SafeAreaWrapper from "../components/SafeAreaWrapper"
import journalService from "../services/journalService"

export default function Journal({ navigation }) {
  const [entries, setEntries] = useState([])
  const [showNewEntry, setShowNewEntry] = useState(false)
  const [newEntryText, setNewEntryText] = useState("")
  const [selectedMood, setSelectedMood] = useState(3)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadEntries()
  }, [])

  const loadEntries = async () => {
    try {
      const result = await journalService.getEntries()
      if (result.success) {
        setEntries(result.entries)
      }
    } catch (error) {
      console.error("Error loading entries:", error)
    }
  }

  const handleSaveEntry = async () => {
    if (!newEntryText.trim()) {
      Alert.alert("Error", "Please write something in your journal entry")
      return
    }

    setLoading(true)
    try {
      const result = await journalService.createEntry({
        text: newEntryText.trim(),
        mood: selectedMood,
      })

      if (result.success) {
        setEntries([result.entry, ...entries])
        setNewEntryText("")
        setSelectedMood(3)
        setShowNewEntry(false)
        Alert.alert("Success", "Your journal entry has been saved securely on your device")
      } else {
        Alert.alert("Error", result.message)
      }
    } catch (error) {
      console.error("Error saving entry:", error)
      Alert.alert("Error", "Failed to save journal entry")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteEntry = async (entryId) => {
    Alert.alert("Delete Entry", "Are you sure you want to delete this journal entry? This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const result = await journalService.deleteEntry(entryId)
          if (result.success) {
            setEntries(entries.filter((entry) => entry.id !== entryId))
          }
        },
      },
    ])
  }

  const getMoodEmoji = (mood) => {
    if (mood >= 5) return "😊"
    if (mood >= 4) return "🙂"
    if (mood >= 3) return "😐"
    if (mood >= 2) return "😔"
    return "😢"
  }

  const getMoodLabel = (mood) => {
    if (mood >= 5) return "Excellent"
    if (mood >= 4) return "Good"
    if (mood >= 3) return "Neutral"
    if (mood >= 2) return "Low"
    return "Very Low"
  }

  const moodOptions = [
    { value: 5, emoji: "😊", label: "Excellent" },
    { value: 4, emoji: "🙂", label: "Good" },
    { value: 3, emoji: "😐", label: "Neutral" },
    { value: 2, emoji: "😔", label: "Low" },
    { value: 1, emoji: "😢", label: "Very Low" },
  ]

  return (
    <SafeAreaWrapper backgroundColor="#dbeafe" statusBarStyle="dark-content">
      <LinearGradient colors={["#f0f9ff", "#e0f2fe"]} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={20} color="#64748b" />
            </TouchableOpacity>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Private Journal</Text>
              <Text style={styles.headerSubtitle}>Your thoughts, encrypted & secure</Text>
            </View>
            <TouchableOpacity style={styles.addButton} onPress={() => setShowNewEntry(true)}>
              <Ionicons name="add" size={20} color="#3b82f6" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Privacy Notice */}
        <View style={styles.privacyNotice}>
          <Ionicons name="shield-checkmark" size={16} color="#059669" />
          <Text style={styles.privacyText}>Your journal entries are encrypted and stored only on your device</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {entries.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="book-outline" size={64} color="#9ca3af" />
              <Text style={styles.emptyTitle}>Start Your Journey</Text>
              <Text style={styles.emptySubtitle}>
                Begin by writing your first journal entry. Your thoughts are private and secure.
              </Text>
              <TouchableOpacity style={styles.emptyButton} onPress={() => setShowNewEntry(true)}>
                <Text style={styles.emptyButtonText}>Write First Entry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.entriesContainer}>
              {entries.map((entry) => (
                <View key={entry.id} style={styles.entryCard}>
                  <View style={styles.entryHeader}>
                    <View style={styles.entryMeta}>
                      <Text style={styles.entryDate}>
                        {new Date(entry.timestamp).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </Text>
                      <Text style={styles.entryTime}>
                        {new Date(entry.timestamp).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                    </View>
                    <View style={styles.entryActions}>
                      <View style={styles.moodIndicator}>
                        <Text style={styles.moodEmoji}>{getMoodEmoji(entry.mood)}</Text>
                        <Text style={styles.moodText}>{getMoodLabel(entry.mood)}</Text>
                      </View>
                      <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteEntry(entry.id)}>
                        <Ionicons name="trash-outline" size={16} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text style={styles.entryText}>{entry.text}</Text>
                  {entry.sentiment && (
                    <View style={styles.sentimentBadge}>
                      <Text style={styles.sentimentText}>Sentiment: {entry.sentiment}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* New Entry Modal */}
        <Modal visible={showNewEntry} animationType="slide" presentationStyle="pageSheet">
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowNewEntry(false)}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>New Entry</Text>
              <TouchableOpacity onPress={handleSaveEntry} disabled={loading}>
                <Text style={[styles.modalSave, loading && styles.modalSaveDisabled]}>
                  {loading ? "Saving..." : "Save"}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {/* Mood Selection */}
              <View style={styles.moodSection}>
                <Text style={styles.moodSectionTitle}>How are you feeling?</Text>
                <View style={styles.moodSelector}>
                  {moodOptions.map((mood) => (
                    <TouchableOpacity
                      key={mood.value}
                      style={[styles.moodOption, selectedMood === mood.value && styles.moodOptionSelected]}
                      onPress={() => setSelectedMood(mood.value)}
                    >
                      <Text style={styles.moodOptionEmoji}>{mood.emoji}</Text>
                      <Text style={styles.moodOptionLabel}>{mood.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Text Input */}
              <View style={styles.textSection}>
                <Text style={styles.textSectionTitle}>What's on your mind?</Text>
                <TextInput
                  style={styles.textInput}
                  multiline
                  placeholder="Write about your day, thoughts, feelings, or anything else..."
                  placeholderTextColor="#9ca3af"
                  value={newEntryText}
                  onChangeText={setNewEntryText}
                  textAlignVertical="top"
                />
              </View>

              {/* Privacy Reminder */}
              <View style={styles.privacyReminder}>
                <Ionicons name="lock-closed" size={16} color="#6b7280" />
                <Text style={styles.privacyReminderText}>
                  This entry will be encrypted and stored securely on your device only
                </Text>
              </View>
            </ScrollView>
        </Modal>
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
    fontWeight: "600",
    color: "#374151",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6b7280",
  },
  addButton: {
    width: 40,
    height: 40,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  privacyNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderRadius: 8,
  },
  privacyText: {
    fontSize: 12,
    color: "#059669",
    fontWeight: "500",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 32,
    lineHeight: 24,
  },
  emptyButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "500",
  },
  entriesContainer: {
    gap: 16,
  },
  entryCard: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  entryMeta: {
    flex: 1,
  },
  entryDate: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 2,
  },
  entryTime: {
    fontSize: 12,
    color: "#6b7280",
  },
  entryActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  moodIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  moodEmoji: {
    fontSize: 20,
  },
  moodText: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },
  deleteButton: {
    padding: 4,
  },
  entryText: {
    fontSize: 16,
    color: "#374151",
    lineHeight: 24,
    marginBottom: 12,
  },
  sentimentBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  sentimentText: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalCancel: {
    fontSize: 16,
    color: "#6b7280",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
  },
  modalSave: {
    fontSize: 16,
    color: "#3b82f6",
    fontWeight: "500",
  },
  modalSaveDisabled: {
    color: "#9ca3af",
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  moodSection: {
    paddingVertical: 24,
  },
  moodSectionTitle: {
    fontSize: 18,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 16,
  },
  moodSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  moodOption: {
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    minWidth: 60,
  },
  moodOptionSelected: {
    borderColor: "#3b82f6",
    backgroundColor: "#eff6ff",
  },
  moodOptionEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  moodOptionLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6b7280",
  },
  textSection: {
    paddingBottom: 24,
  },
  textSectionTitle: {
    fontSize: 18,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 16,
  },
  textInput: {
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: "#374151",
    minHeight: 200,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  privacyReminder: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    marginBottom: 24,
  },
  privacyReminderText: {
    fontSize: 12,
    color: "#6b7280",
    flex: 1,
  },
})
