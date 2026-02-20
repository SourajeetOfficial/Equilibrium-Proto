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
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
  ActivityIndicator,
  Share
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
import { useState, useEffect, useCallback, useRef } from "react"
import DateTimePicker from "@react-native-community/datetimepicker"
import { LineChart } from "react-native-chart-kit"

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

import SafeAreaWrapper from "../components/SafeAreaWrapper"
import journalService from "../services/journalService"
import onDeviceAIService from "../services/onDeviceAIService"
import devModeService from "../services/devsModeService"

const { width: screenWidth } = Dimensions.get("window")

// ─────────────────────────────────────────────────────────────
// EMOJI FIX
// The source files have encoding issues (mojibake). Rather than
// touching the AI service, we intercept at render time with a
// clean lookup map keyed by sentiment string.
// ─────────────────────────────────────────────────────────────
const SENTIMENT_EMOJI = {
  very_positive:    "🤩",
  positive:         "😊",
  slightly_positive:"🙂",
  neutral:          "😐",
  slightly_negative:"😕",
  negative:         "😢",
  very_negative:    "😭",
  // Mood keys (from MOOD_DEFINITIONS)
  ecstatic:         "🤩",
  happy:            "😊",
  grateful:         "🥰",
  calm:             "😌",
  motivated:        "💪",
  low:              "😔",
  sad:              "😢",
  devastated:       "😭",
  anxious:          "😰",
  scared:           "😨",
  frustrated:       "😤",
}

// Sentiment → rich gradient pairs (more aesthetic than plain score gradients)
const SENTIMENT_GRADIENT = {
  very_positive:    ["#10b981", "#06b6d4"],   // emerald → cyan
  positive:         ["#22c55e", "#84cc16"],   // green → lime
  slightly_positive:["#84cc16", "#eab308"],   // lime → yellow
  neutral:          ["#6b7280", "#94a3b8"],   // gray → slate
  slightly_negative:["#8b5cf6", "#6366f1"],   // violet → indigo
  negative:         ["#3b82f6", "#6366f1"],   // blue → indigo
  very_negative:    ["#1e40af", "#3b82f6"],   // dark blue → blue
  // Mood keys map to their own brand colors
  ecstatic:         ["#10b981", "#06b6d4"],
  happy:            ["#22c55e", "#4ade80"],
  grateful:         ["#ec4899", "#f472b6"],
  calm:             ["#06b6d4", "#818cf8"],
  motivated:        ["#f59e0b", "#fb923c"],
  low:              ["#8b5cf6", "#a78bfa"],
  sad:              ["#3b82f6", "#60a5fa"],
  devastated:       ["#1e40af", "#3b82f6"],
  anxious:          ["#eab308", "#f97316"],
  scared:           ["#f97316", "#ef4444"],
  frustrated:       ["#ef4444", "#dc2626"],
}

const SENTIMENT_LABEL = {
  very_positive:    "Feeling Great!",
  positive:         "Feeling Good",
  slightly_positive:"Doing Okay",
  neutral:          "Feeling Neutral",
  slightly_negative:"Feeling Low",
  negative:         "Feeling Down",
  very_negative:    "Struggling",
  ecstatic:         "Ecstatic!",
  happy:            "Happy",
  grateful:         "Grateful",
  calm:             "Calm",
  motivated:        "Motivated",
  low:              "Feeling Low",
  sad:              "Feeling Sad",
  devastated:       "Devastated",
  anxious:          "Anxious",
  scared:           "Scared",
  frustrated:       "Frustrated",
}

// Returns the emoji for a given sentiment/mood key — clean, no mojibake
function getEmoji(sentimentOrMoodKey) {
  return SENTIMENT_EMOJI[sentimentOrMoodKey] || "😐"
}

function getGradient(sentimentOrMoodKey) {
  return SENTIMENT_GRADIENT[sentimentOrMoodKey] || ["#6b7280", "#94a3b8"]
}

function getLabel(sentimentOrMoodKey) {
  return SENTIMENT_LABEL[sentimentOrMoodKey] || "Feeling Neutral"
}

// ─────────────────────────────────────────────────────────────
// Derive "current mood" from the last non-deleted log entry.
// Falls back to day-average currentSentiment if no logs yet.
// ─────────────────────────────────────────────────────────────
function getCurrentMoodFromJournal(journal) {
  if (!journal) return { sentiment: "neutral", score: 50, isMoodTap: false }

  const logs = (journal.logs || []).filter(l => !l.deleted)
  
  if (logs.length === 0) {
    // No entries yet — show neutral placeholder
    return { sentiment: "neutral", score: journal.currentScore || 50, isMoodTap: false }
  }

  // Most recent log
  const last = logs[logs.length - 1]

  if (last.type === "mood") {
    // Mood tap — use the mood key directly for richer gradient
    return {
      sentiment: last.moodKey || last.sentiment || "neutral",
      score: last.sentimentScore || 50,
      isMoodTap: true,
      label: last.moodLabel,
    }
  }

  // Text entry — use its analyzed sentiment
  return {
    sentiment: last.sentiment || "neutral",
    score: last.sentimentScore || 50,
    isMoodTap: false,
  }
}

export default function Journal({ navigation }) {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0])
  const [journal, setJournal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showEditor, setShowEditor] = useState(false)
  const [newEntryText, setNewEntryText] = useState("")
  const [showTrendModal, setShowTrendModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [moodOptions, setMoodOptions] = useState([])
  const [devModeActive, setDevModeActive] = useState(devModeService.isActive)

  const scrollViewRef = useRef(null)

  const getTodayStr = () => new Date().toISOString().split('T')[0]
  const isToday = selectedDate === getTodayStr()
  const canGoForward = selectedDate < getTodayStr()
  const formattedDate = journalService.formatDateForDisplay(selectedDate)

  // Subscribe to dev mode changes
  useEffect(() => {
    const unsub = devModeService.subscribe((active) => setDevModeActive(active))
    return unsub
  }, [])

  const loadJournal = useCallback(async () => {
    setLoading(true)
    try {
      const result = await journalService.getJournal(selectedDate)
      if (result.success) setJournal(result.journal)
      setMoodOptions(journalService.getMoodOptions())
    } catch (error) {
      console.error("Error loading journal:", error)
    } finally {
      setLoading(false)
    }
  }, [selectedDate])

  useEffect(() => { loadJournal() }, [loadJournal])

  const changeDate = (days) => {
    const date = new Date(selectedDate + "T12:00:00")
    date.setDate(date.getDate() + days)
    const newDateStr = date.toISOString().split('T')[0]
    if (newDateStr > getTodayStr()) return
    setSelectedDate(newDateStr)
  }

  const handleDateChange = (event, date) => {
    setShowDatePicker(Platform.OS === "ios")
    if (event.type === "dismissed") return
    if (date) {
      const dateString = date.toISOString().split('T')[0]
      if (dateString > getTodayStr()) {
        Alert.alert("Invalid Date", "Cannot select future dates")
      } else {
        setSelectedDate(dateString)
      }
    }
  }

  const handleSaveEntry = async () => {
    if (!newEntryText.trim()) return
    setSaving(true)
    Keyboard.dismiss()
    try {
      const result = await journalService.addTextEntry(newEntryText.trim(), selectedDate)
      if (result.success) {
        setJournal(result.journal)
        setNewEntryText("")
        setShowEditor(false)
      } else {
        Alert.alert("Error", result.message)
      }
    } catch (error) {
      Alert.alert("Error", "Failed to save entry")
    } finally {
      setSaving(false)
    }
  }

  const handleAddMoodEntry = async (moodKey) => {
    setSaving(true)
    try {
      const result = await journalService.addMoodEntry(moodKey, selectedDate)
      if (result.success) setJournal(result.journal)
    } catch (error) {
      console.error("Error adding mood:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleLongPressLog = (logId) => {
    if (!isToday) return
    Alert.alert("Manage Entry", "Do you want to delete this part of your journal?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          const result = await journalService.deleteLog(logId, selectedDate)
          if (result.success) setJournal(result.journal)
      }},
    ])
  }

  const formatTime = (timestamp) =>
    new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "numeric", minute: "2-digit", hour12: true
    }).toLowerCase()

  // --- EXPORT ---

  const generatePDF = async () => {
    try {
      const htmlContent = `
        <html><head><style>
          body { font-family: Helvetica, sans-serif; padding: 40px; color: #333; }
          h1 { color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
          .date { color: #64748b; margin-bottom: 30px; font-style: italic; }
          .entry { margin-bottom: 20px; line-height: 1.6; font-size: 14pt; }
          .mood { color: #3b82f6; font-weight: bold; }
          .meta { font-size: 10pt; color: #94a3b8; margin-top: 5px; }
        </style></head><body>
          <h1>My Journal</h1>
          <p class="date">${formattedDate.full}</p>
          ${journal?.logs?.map(log => `
            <div class="entry">
              ${log.deleted ? '<em>[Deleted Entry]</em>' :
                log.type === 'mood'
                ? `<span class="mood">Feeling ${log.moodLabel}</span>`
                : log.text}
              <div class="meta">${formatTime(log.timestamp)}</div>
            </div>
          `).join('')}
        </body></html>`
      const { uri } = await Print.printToFileAsync({ html: htmlContent })
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' })
      setShowExportModal(false)
    } catch {
      Alert.alert("Error", "Could not generate PDF")
    }
  }

  const generateTextFile = async () => {
    try {
      const textContent = `JOURNAL ENTRY - ${formattedDate.full}\n\n` +
        journal?.logs?.map(log => {
          if (log.deleted) return "[Deleted Entry]"
          const time = formatTime(log.timestamp)
          const content = log.type === 'mood' ? `Mood: ${log.moodLabel}` : log.text
          return `${content}\n[${time}]\n`
        }).join('\n')
      const fileUri = FileSystem.documentDirectory + `Journal_${selectedDate}.txt`
      await FileSystem.writeAsStringAsync(fileUri, textContent)
      await Sharing.shareAsync(fileUri)
      setShowExportModal(false)
    } catch {
      Alert.alert("Error", "Could not generate text file")
    }
  }

  const shareAsText = async () => {
    try {
      const message = journal?.logs?.map(l => {
        if (l.deleted) return null
        return l.type === 'mood' ? `Feeling ${l.moodLabel}` : l.text
      }).filter(Boolean).join('\n\n')
      if (!message) return
      await Share.share({ message: `Journal - ${formattedDate.full}\n\n${message}` })
      setShowExportModal(false)
    } catch (error) {
      console.log(error)
    }
  }

  // --- RENDERERS ---

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
        <Ionicons name="arrow-back" size={24} color="#64748b" />
      </TouchableOpacity>

      <View style={styles.dateNavContainer}>
        <TouchableOpacity onPress={() => changeDate(-1)} style={styles.navArrow}>
          <Ionicons name="chevron-back" size={20} color="#64748b" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateDisplay}>
          <Text style={styles.dateText}>{formattedDate.dateOnly}</Text>
          {isToday && <View style={styles.todayDot} />}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => changeDate(1)}
          disabled={!canGoForward}
          style={[styles.navArrow, !canGoForward && styles.disabledArrow]}
        >
          <Ionicons name="chevron-forward" size={20} color="#64748b" />
        </TouchableOpacity>
      </View>

      {/* Right icon: export (always visible) — dev score toggle removed, now gated by devMode */}
      <TouchableOpacity onPress={() => setShowExportModal(true)} style={styles.iconBtn}>
        <Ionicons name="share-social-outline" size={22} color="#64748b" />
      </TouchableOpacity>
    </View>
  )

  const renderMoodSection = () => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Quick Mood</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.moodList}>
        {moodOptions.map((mood) => (
          <TouchableOpacity
            key={mood.key}
            style={[styles.moodBtn, { borderColor: mood.color + '40', backgroundColor: mood.color + '10' }]}
            onPress={() => handleAddMoodEntry(mood.key)}
            disabled={!isToday || saving}
          >
            {/* Use our clean emoji map instead of mood.emoji (which has encoding issues) */}
            <Text style={styles.moodEmoji}>{getEmoji(mood.key)}</Text>
            <Text style={[styles.moodLabel, { color: mood.color }]}>{mood.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )

  const renderSentimentCard = () => {
    // ── Current mood = last entry's sentiment, not the day average ──
    const currentMood = getCurrentMoodFromJournal(journal)
    const emoji = getEmoji(currentMood.sentiment)
    const gradient = getGradient(currentMood.sentiment)
    const label = currentMood.label || getLabel(currentMood.sentiment)

    const hasEntries = (journal?.logs || []).filter(l => !l.deleted).length > 0

    return (
      <View style={styles.sectionContainer}>
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.sentimentCard}
        >
          {/* Subtle inner glow overlay for depth */}
          <View style={styles.sentimentGlowOverlay} />

          <View style={styles.sentimentContent}>
            <View style={styles.sentimentEmojiContainer}>
              <Text style={styles.sentimentEmojiLarge}>{emoji}</Text>
            </View>

            <View style={styles.sentimentInfo}>
              <Text style={styles.sentimentSubheading}>
                {hasEntries ? "Current Mood" : "No entries yet"}
              </Text>
              <Text style={styles.sentimentTitle}>{label}</Text>

              {/* Dev mode: show raw AI score */}
              {devModeActive && (
                <View style={styles.devScorePill}>
                  <Text style={styles.devScoreText}>
                    ⚙ score: {currentMood.score} · {currentMood.sentiment}
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity style={styles.graphBtn} onPress={() => setShowTrendModal(true)}>
              <Ionicons name="stats-chart" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    )
  }

  const renderJournalEntries = () => {
    const logs = journal?.logs || []
    return (
      <View style={styles.journalListContainer}>
        <View style={styles.journalHeader}>
          <Text style={styles.sectionTitle}>Journal</Text>
          {logs.length > 0 && (
            <TouchableOpacity onPress={() => setShowExportModal(true)}>
              <Ionicons name="share-social-outline" size={20} color="#3b82f6" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.journalCard}>
          {logs.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="book-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>
                {isToday ? "Your page is empty." : "No entries for this day."}
              </Text>
            </View>
          ) : (
            logs.map((log) => (
              <TouchableOpacity
                key={log.id}
                onLongPress={() => handleLongPressLog(log.id)}
                delayLongPress={500}
                activeOpacity={0.8}
              >
                <View style={styles.entryBlock}>
                  <Text style={[styles.entryText, log.deleted && styles.deletedText]}>
                    {log.deleted
                      ? "[Entry deleted]"
                      : log.type === 'mood'
                        // Use clean emoji for mood entries in the log too
                        ? `${getEmoji(log.moodKey || log.sentiment)}  Feeling ${log.moodLabel}`
                        : log.text
                    }
                    <Text style={styles.inlineTimestamp}>  {formatTime(log.timestamp)}</Text>
                  </Text>

                  {/* Dev mode: per-entry AI debug line */}
                  {devModeActive && !log.deleted && (
                    <Text style={styles.devEntryDebug}>
                      ⚙ {log.sentiment ?? "—"} · {log.sentimentScore?.toFixed(1) ?? "—"} · conf: {log.confidence ?? "—"}
                    </Text>
                  )}
                </View>
                <View style={styles.entryDivider} />
              </TouchableOpacity>
            ))
          )}
          {isToday ? (
            <TouchableOpacity
              style={styles.writeButton}
              onPress={() => setShowEditor(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="create-outline" size={20} color="#fff" />
              <Text style={styles.writeButtonText}>Write something new...</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.readOnlyBanner}>
              <Ionicons name="lock-closed-outline" size={14} color="#94a3b8" />
              <Text style={styles.readOnlyText}>Read-only view</Text>
            </View>
          )}
        </View>
      </View>
    )
  }

  // --- MODALS ---

  const renderExportModal = () => (
    <Modal visible={showExportModal} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.exportCard}>
          <View style={styles.trendHeader}>
            <Text style={styles.trendTitle}>Export Journal</Text>
            <TouchableOpacity onPress={() => setShowExportModal(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.exportOption} onPress={generatePDF}>
            <View style={[styles.exportIcon, { backgroundColor: '#fee2e2' }]}>
              <Ionicons name="document-text" size={24} color="#ef4444" />
            </View>
            <View>
              <Text style={styles.exportLabel}>Save as PDF</Text>
              <Text style={styles.exportSub}>Best for printing</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.exportOption} onPress={generateTextFile}>
            <View style={[styles.exportIcon, { backgroundColor: '#e0f2fe' }]}>
              <Ionicons name="document" size={24} color="#0ea5e9" />
            </View>
            <View>
              <Text style={styles.exportLabel}>Save as Text File</Text>
              <Text style={styles.exportSub}>Best for documents</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.exportOption} onPress={shareAsText}>
            <View style={[styles.exportIcon, { backgroundColor: '#dcfce7' }]}>
              <Ionicons name="share-social" size={24} color="#22c55e" />
            </View>
            <View>
              <Text style={styles.exportLabel}>Share Content</Text>
              <Text style={styles.exportSub}>Copy to clipboard or messaging</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )

  const renderEditorModal = () => (
    <Modal visible={showEditor} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaWrapper backgroundColor="#fff">
        <View style={styles.editorContainer}>
          <View style={styles.editorHeader}>
            <TouchableOpacity onPress={() => setShowEditor(false)} style={styles.closeEditorBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.editorTitle}>New Entry</Text>
            <TouchableOpacity
              onPress={handleSaveEntry}
              disabled={!newEntryText.trim() || saving}
              style={[styles.saveEditorBtn, (!newEntryText.trim() || saving) && styles.disabledSave]}
            >
              <Text style={styles.saveText}>{saving ? "Saving..." : "Save"}</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.editorInput}
            multiline
            placeholder="What's on your mind today?"
            placeholderTextColor="#9ca3af"
            value={newEntryText}
            onChangeText={setNewEntryText}
            autoFocus
            textAlignVertical="top"
          />
        </View>
      </SafeAreaWrapper>
    </Modal>
  )

  const renderTrendModal = () => {
    const scoreHistory = journal?.scoreHistory || []
    const dataPoints = scoreHistory.map(h => h.score)
    const labels = scoreHistory.map(h =>
      new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    )
    const chartLabels = labels.map((label, index) => {
      if (index === 0 || index === labels.length - 1 || index % Math.ceil(labels.length / 4) === 0) return label
      return ""
    })

    return (
      <Modal visible={showTrendModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.trendCard}>
            <View style={styles.trendHeader}>
              <Text style={styles.trendTitle}>Daily Sentiment Trend</Text>
              <TouchableOpacity onPress={() => setShowTrendModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            {dataPoints.length >= 2 ? (
              <LineChart
                data={{ labels: chartLabels, datasets: [{ data: dataPoints }] }}
                width={screenWidth - 80}
                height={220}
                yAxisSuffix=""
                chartConfig={{
                  backgroundColor: "#ffffff",
                  backgroundGradientFrom: "#ffffff",
                  backgroundGradientTo: "#ffffff",
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
                  propsForDots: { r: "4", strokeWidth: "2", stroke: "#3b82f6" },
                  propsForBackgroundLines: { strokeDasharray: "", stroke: "#f1f5f9" }
                }}
                bezier
                style={{ marginVertical: 8, borderRadius: 16 }}
                withInnerLines
                withOuterLines={false}
                withVerticalLines={false}
              />
            ) : (
              <View style={styles.noDataContainer}>
                <Ionicons name="bar-chart-outline" size={48} color="#e2e8f0" />
                <Text style={styles.noDataText}>Graph requires at least 2 entries to show a trend.</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    )
  }

  return (
    <SafeAreaWrapper backgroundColor="#f0f9ff" statusBarStyle="dark-content">
      <LinearGradient colors={["#f0f9ff", "#e0f2fe"]} style={styles.container}>
        {renderHeader()}
        {showDatePicker && (
          <DateTimePicker
            value={new Date(selectedDate)}
            mode="date"
            display="default"
            onChange={handleDateChange}
            maximumDate={new Date()}
          />
        )}
        <ScrollView
          ref={scrollViewRef}
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {loading ? (
            <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 50 }} />
          ) : (
            <>
              {isToday && renderMoodSection()}
              {renderSentimentCard()}
              {renderJournalEntries()}
            </>
          )}
        </ScrollView>
        {renderEditorModal()}
        {renderTrendModal()}
        {renderExportModal()}
      </LinearGradient>
    </SafeAreaWrapper>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 12,
  },
  iconBtn: {
    padding: 8, backgroundColor: '#fff', borderRadius: 20,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  dateNavContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    padding: 4, borderRadius: 25,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  navArrow: { padding: 8 },
  disabledArrow: { opacity: 0.3 },
  dateDisplay: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
  dateText: { fontSize: 14, fontWeight: '600', color: '#334155' },
  todayDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#3b82f6', marginLeft: 6 },

  content: { flex: 1, paddingHorizontal: 20 },
  sectionContainer: { marginTop: 20 },
  sectionTitle: {
    fontSize: 14, fontWeight: '600', color: '#64748b',
    marginBottom: 10, marginLeft: 4,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  journalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10, paddingHorizontal: 4,
  },

  // Mood quick-tap row
  moodList: { paddingRight: 20 },
  moodBtn: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, paddingHorizontal: 12,
    backgroundColor: '#fff', borderRadius: 16,
    marginRight: 10, borderWidth: 1,
  },
  moodEmoji: { fontSize: 22, marginBottom: 4 },
  moodLabel: { fontSize: 10, fontWeight: '600' },

  // Sentiment card
  sentimentCard: {
    borderRadius: 20, padding: 20, overflow: 'hidden',
    shadowColor: "#3b82f6", shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 6,
  },
  sentimentGlowOverlay: {
    position: 'absolute', top: -40, right: -40,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  sentimentContent: { flexDirection: 'row', alignItems: 'center' },
  sentimentEmojiContainer: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
    marginRight: 16,
  },
  sentimentEmojiLarge: { fontSize: 32 },
  sentimentInfo: { flex: 1 },
  sentimentSubheading: {
    fontSize: 11, color: 'rgba(255,255,255,0.75)',
    fontWeight: '600', textTransform: 'uppercase',
    letterSpacing: 0.5, marginBottom: 3,
  },
  sentimentTitle: { fontSize: 22, fontWeight: '700', color: '#fff' },

  // Dev score pill (shown only in dev mode)
  devScorePill: {
    marginTop: 6, alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  devScoreText: {
    fontSize: 10, color: 'rgba(255,255,255,0.9)',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  graphBtn: {
    padding: 10, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12,
  },

  // Journal entries
  journalListContainer: { marginTop: 24 },
  journalCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 24, minHeight: 300,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
  },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { color: '#94a3b8', marginTop: 12, fontSize: 14 },
  entryBlock: { marginBottom: 8 },
  entryText: { fontSize: 16, color: '#334155', lineHeight: 26, textAlign: 'left' },
  deletedText: { color: '#94a3b8', fontStyle: 'italic', fontSize: 14 },
  inlineTimestamp: { fontSize: 11, color: '#94a3b8', fontStyle: 'italic' },
  entryDivider: {
    height: 1, backgroundColor: '#f1f5f9',
    marginVertical: 12, width: '40%', alignSelf: 'center', opacity: 0.5,
  },

  // Per-entry dev debug line
  devEntryDebug: {
    fontSize: 10, color: '#6366f1', marginTop: 3,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  writeButton: {
    backgroundColor: '#3b82f6', borderRadius: 16, paddingVertical: 14,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20,
    shadowColor: "#3b82f6", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  writeButtonText: { color: '#fff', fontWeight: '600', fontSize: 16, marginLeft: 8 },
  readOnlyBanner: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    paddingVertical: 12, backgroundColor: '#f8fafc', borderRadius: 12, marginTop: 20,
  },
  readOnlyText: { color: '#94a3b8', fontSize: 12, marginLeft: 6 },

  // Editor modal
  editorContainer: { flex: 1, backgroundColor: '#fff' },
  editorHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  closeEditorBtn: { padding: 8 },
  cancelText: { fontSize: 16, color: '#64748b' },
  editorTitle: { fontSize: 18, fontWeight: '600', color: '#1e293b' },
  saveEditorBtn: {
    backgroundColor: '#3b82f6', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
  },
  disabledSave: { backgroundColor: '#93c5fd' },
  saveText: { color: '#fff', fontWeight: '600' },
  editorInput: { flex: 1, padding: 24, fontSize: 18, color: '#334155', lineHeight: 28 },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  trendCard: { backgroundColor: '#fff', borderRadius: 24, padding: 24, width: screenWidth - 40 },
  trendHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  trendTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
  noDataContainer: { height: 220, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 16 },
  noDataText: { marginTop: 12, color: '#94a3b8', textAlign: 'center', paddingHorizontal: 20 },
  exportCard: { backgroundColor: '#fff', borderRadius: 24, padding: 24, width: screenWidth - 40 },
  exportOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  exportIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  exportLabel: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  exportSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
})