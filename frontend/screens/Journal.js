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

// NEW IMPORTS FOR EXPORTING
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

import SafeAreaWrapper from "../components/SafeAreaWrapper"
import journalService from "../services/journalService"
import onDeviceAIService from "../services/onDeviceAIService"

const { width: screenWidth } = Dimensions.get("window")

export default function Journal({ navigation }) {
  // --- STATE ---
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date()
    return now.toISOString().split('T')[0]
  })
  
  const [journal, setJournal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  
  // Editor State
  const [showEditor, setShowEditor] = useState(false)
  const [newEntryText, setNewEntryText] = useState("")
  const [wordCount, setWordCount] = useState(0)
  
  // Modals State
  const [showTrendModal, setShowTrendModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false) // NEW
  
  const [settings, setSettings] = useState({ showDevScore: false })
  const [moodOptions, setMoodOptions] = useState([])
  
  const scrollViewRef = useRef(null)

  // --- ROBUST DATE LOGIC ---
  const getTodayStr = () => new Date().toISOString().split('T')[0]
  const isToday = selectedDate === getTodayStr()
  const canGoForward = selectedDate < getTodayStr()
  const formattedDate = journalService.formatDateForDisplay(selectedDate)

  // --- DATA LOADING ---
  const loadJournal = useCallback(async () => {
    setLoading(true)
    try {
      const result = await journalService.getJournal(selectedDate)
      if (result.success) {
        setJournal(result.journal)
      }
      const settingsResult = await journalService.getSettings()
      setSettings(settingsResult)
      setMoodOptions(journalService.getMoodOptions())
    } catch (error) {
      console.error("Error loading journal:", error)
    } finally {
      setLoading(false)
    }
  }, [selectedDate])

  useEffect(() => {
    loadJournal()
  }, [loadJournal])

  // --- NAVIGATION HANDLERS ---
  const changeDate = (days) => {
    const date = new Date(selectedDate + "T12:00:00");
    date.setDate(date.getDate() + days);
    const newDateStr = date.toISOString().split('T')[0];
    const today = getTodayStr();
    if (newDateStr > today) return; 
    setSelectedDate(newDateStr);
  }

  const handleDateChange = (event, date) => {
    setShowDatePicker(Platform.OS === "ios")
    if (event.type === "dismissed") return
    if (date) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const dateString = `${year}-${month}-${day}`
      if (dateString > getTodayStr()) {
        Alert.alert("Invalid Date", "Cannot select future dates")
      } else {
        setSelectedDate(dateString)
      }
    }
  }

  // --- ACTIONS ---
  const handleSaveEntry = async () => {
    if (!newEntryText.trim()) return
    setSaving(true)
    Keyboard.dismiss()
    try {
      const result = await journalService.addTextEntry(newEntryText.trim(), selectedDate)
      if (result.success) {
        setJournal(result.journal)
        setNewEntryText("")
        setWordCount(0)
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
      if (result.success) {
        setJournal(result.journal)
      }
    } catch (error) {
      console.error("Error adding mood:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleLongPressLog = (logId) => {
    if (!isToday) return;
    Alert.alert("Manage Entry", "Do you want to delete this part of your journal?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          const result = await journalService.deleteLog(logId, selectedDate)
          if (result.success) setJournal(result.journal)
      }},
    ])
  }

  const toggleDevScore = async () => {
    const newSettings = { ...settings, showDevScore: !settings.showDevScore }
    setSettings(newSettings)
    await journalService.updateSettings(newSettings)
  }

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "numeric", minute: "2-digit", hour12: true
    }).toLowerCase()
  }

  // --- EXPORT FUNCTIONS ---

  const generatePDF = async () => {
    try {
      // Privacy: export only active (non-deleted) entries
      const activeLogs = journal?.logs?.filter(log => !log.deleted) || []
      if (activeLogs.length === 0) {
        Alert.alert("Nothing to Export", "There are no entries to export for this day.")
        return
      }
      const htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #333; }
              h1 { color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
              .date { color: #64748b; margin-bottom: 30px; font-style: italic; }
              .entry { margin-bottom: 20px; line-height: 1.6; font-size: 14pt; }
              .mood { color: #3b82f6; font-weight: bold; }
              .meta { font-size: 10pt; color: #94a3b8; margin-top: 5px; }
              .footer { margin-top: 40px; font-size: 9pt; color: #cbd5e1; border-top: 1px solid #e2e8f0; padding-top: 10px; }
            </style>
          </head>
          <body>
            <h1>My Journal</h1>
            <p class="date">${formattedDate.full}</p>
            ${activeLogs.map(log => `
              <div class="entry">
                ${log.type === 'mood' 
                  ? `<span class="mood">Feeling ${log.moodLabel} ${log.moodEmoji}</span>` 
                  : log.text
                }
                <div class="meta">${formatTime(log.timestamp)}</div>
              </div>
            `).join('')}
            <div class="footer">Exported from Equilibrium &bull; ${new Date().toLocaleDateString()}</div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      setShowExportModal(false);
    } catch (error) {
      Alert.alert("Error", "Could not generate PDF");
    }
  };

  const generateTextFile = async () => {
    try {
      // Privacy: only export active entries
      const activeLogs = journal?.logs?.filter(log => !log.deleted) || []
      if (activeLogs.length === 0) {
        Alert.alert("Nothing to Export", "There are no entries to export for this day.")
        return
      }
      const textContent = `JOURNAL ENTRY - ${formattedDate.full}\n\n` + 
        activeLogs.map(log => {
          const time = formatTime(log.timestamp);
          const entryContent = log.type === 'mood' ? `Mood: ${log.moodLabel} ${log.moodEmoji}` : log.text;
          return `${entryContent}\n[${time}]\n`;
        }).join('\n') +
        `\n---\nExported from Equilibrium on ${new Date().toLocaleDateString()}`;

      const fileUri = FileSystem.documentDirectory + `Journal_${selectedDate}.txt`;
      await FileSystem.writeAsStringAsync(fileUri, textContent);
      await Sharing.shareAsync(fileUri);
      setShowExportModal(false);
    } catch (error) {
      Alert.alert("Error", "Could not generate text file");
    }
  };

  const shareAsText = async () => {
    try {
        // Privacy: only share active (non-deleted) entries
        const activeLogs = journal?.logs?.filter(l => !l.deleted) || []
        const message = activeLogs
          .map(l => l.type === 'mood' ? `Feeling ${l.moodLabel} ${l.moodEmoji}` : l.text)
          .join('\n\n');
        
        if (!message) {
          Alert.alert("Nothing to Share", "There are no entries to share for this day.")
          return
        }
        await Share.share({
            message: `Journal - ${formattedDate.full}\n\n${message}`
        });
        setShowExportModal(false);
    } catch (error) {
        console.log(error);
    }
  }

  // --- GRAPH EXPORT ---

  const generateGraphPDF = async () => {
    try {
      const scoreHistory = journal?.scoreHistory || []
      if (scoreHistory.length < 2) {
        Alert.alert("Not Enough Data", "Add at least 2 entries to generate a trend graph.")
        return
      }

      // Build an SVG line chart in HTML/CSS — no native dependencies needed
      const points = scoreHistory.map((h, i) => ({
        x: i,
        y: h.score,
        time: new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sentiment: h.sentiment,
      }))

      const svgWidth = 500
      const svgHeight = 260
      const padL = 40, padR = 20, padT = 20, padB = 40
      const chartW = svgWidth - padL - padR
      const chartH = svgHeight - padT - padB

      const minY = Math.min(...points.map(p => p.y)) - 5
      const maxY = Math.max(...points.map(p => p.y)) + 5
      const xStep = points.length > 1 ? chartW / (points.length - 1) : chartW

      const toSvgX = (i) => padL + i * xStep
      const toSvgY = (score) => padT + chartH - ((score - minY) / (maxY - minY)) * chartH

      // Build polyline points string
      const polyPoints = points.map((p, i) => `${toSvgX(i)},${toSvgY(p.y)}`).join(' ')

      // Build grid lines (every 20 score units)
      const gridLines = []
      for (let score = 0; score <= 100; score += 20) {
        if (score >= minY && score <= maxY) {
          const y = toSvgY(score)
          gridLines.push(`<line x1="${padL}" y1="${y}" x2="${svgWidth - padR}" y2="${y}" stroke="#e2e8f0" stroke-width="1"/>`)
          gridLines.push(`<text x="${padL - 6}" y="${y + 4}" text-anchor="end" font-size="9" fill="#94a3b8">${score}</text>`)
        }
      }

      // X-axis labels (show max 6)
      const labelStep = Math.ceil(points.length / 6)
      const xLabels = points
        .filter((_, i) => i % labelStep === 0 || i === points.length - 1)
        .map((p, _, arr) => {
          const i = points.indexOf(p)
          return `<text x="${toSvgX(i)}" y="${svgHeight - padB + 16}" text-anchor="middle" font-size="9" fill="#94a3b8">${p.time}</text>`
        })

      // Data point circles
      const circles = points.map((p, i) => {
        const color = p.y >= 65 ? '#22c55e' : p.y >= 45 ? '#6b7280' : p.y >= 25 ? '#f97316' : '#ef4444'
        return `<circle cx="${toSvgX(i)}" cy="${toSvgY(p.y)}" r="4" fill="${color}" stroke="white" stroke-width="1.5"/>`
      })

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Helvetica, sans-serif; padding: 32px; color: #1e293b; background: #fff; }
              h2 { color: #1e293b; margin-bottom: 4px; font-size: 20px; }
              .subtitle { color: #64748b; font-size: 13px; margin-bottom: 28px; }
              .chart-container { background: #f8fafc; border-radius: 16px; padding: 20px; }
              .stats-row { display: flex; gap: 24px; margin-top: 20px; }
              .stat { background: #f1f5f9; border-radius: 10px; padding: 12px 20px; flex: 1; }
              .stat-label { font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
              .stat-value { font-size: 22px; font-weight: 700; color: #1e293b; margin-top: 4px; }
              .legend { display: flex; gap: 16px; margin-top: 12px; flex-wrap: wrap; }
              .legend-item { display: flex; align-items: center; gap: 6px; font-size: 11px; color: #64748b; }
              .dot { width: 10px; height: 10px; border-radius: 50%; }
              .footer { margin-top: 24px; font-size: 10px; color: #cbd5e1; text-align: center; }
            </style>
          </head>
          <body>
            <h2>Daily Sentiment Trend</h2>
            <p class="subtitle">${formattedDate.full} &bull; ${points.length} data point${points.length !== 1 ? 's' : ''}</p>
            
            <div class="chart-container">
              <svg width="100%" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
                <!-- Grid lines -->
                ${gridLines.join('')}
                <!-- X-axis baseline -->
                <line x1="${padL}" y1="${svgHeight - padB}" x2="${svgWidth - padR}" y2="${svgHeight - padB}" stroke="#e2e8f0" stroke-width="1"/>
                <!-- Area fill under line -->
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.15"/>
                    <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.01"/>
                  </linearGradient>
                </defs>
                <polygon points="${polyPoints} ${toSvgX(points.length - 1)},${svgHeight - padB} ${toSvgX(0)},${svgHeight - padB}" fill="url(#areaGrad)"/>
                <!-- Line -->
                <polyline points="${polyPoints}" fill="none" stroke="#3b82f6" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
                <!-- Data points -->
                ${circles.join('')}
                <!-- X labels -->
                ${xLabels.join('')}
              </svg>
            </div>

            <div class="stats-row">
              <div class="stat">
                <div class="stat-label">Peak Score</div>
                <div class="stat-value">${Math.max(...points.map(p => p.y))}</div>
              </div>
              <div class="stat">
                <div class="stat-label">Low Score</div>
                <div class="stat-value">${Math.min(...points.map(p => p.y))}</div>
              </div>
              <div class="stat">
                <div class="stat-label">Final Score</div>
                <div class="stat-value">${points[points.length - 1].y}</div>
              </div>
            </div>

            <div class="legend">
              <div class="legend-item"><div class="dot" style="background:#22c55e"></div> Positive (65+)</div>
              <div class="legend-item"><div class="dot" style="background:#6b7280"></div> Neutral (45-64)</div>
              <div class="legend-item"><div class="dot" style="background:#f97316"></div> Low (25-44)</div>
              <div class="legend-item"><div class="dot" style="background:#ef4444"></div> Struggling (&lt;25)</div>
            </div>
            
            <div class="footer">Generated by Equilibrium &bull; ${new Date().toLocaleDateString()}</div>
          </body>
        </html>
      `
      const { uri } = await Print.printToFileAsync({ html: htmlContent, base64: false })
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' })
      setShowTrendModal(false)
    } catch (error) {
      console.error("Graph export error:", error)
      Alert.alert("Error", "Could not export graph")
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

      <TouchableOpacity onPress={toggleDevScore} style={styles.iconBtn}>
        <Ionicons name={settings.showDevScore ? "code-slash" : "settings-outline"} size={22} color="#64748b" />
      </TouchableOpacity>
    </View>
  )

  const renderMoodSection = () => {
    // Find the last logged mood for today to show a checkmark indicator
    const lastMoodLog = journal?.logs
      ?.filter(l => !l.deleted && l.type === 'mood')
      ?.slice(-1)[0]
    const lastMoodKey = lastMoodLog?.moodKey || null

    return (
      <View style={styles.sectionContainer}>
        <View style={styles.moodSectionHeader}>
          <Text style={styles.sectionTitle}>Quick Mood</Text>
          {lastMoodKey && (
            <Text style={styles.lastMoodNote}>Last: {lastMoodLog.moodEmoji} {lastMoodLog.moodLabel}</Text>
          )}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.moodList}>
          {moodOptions.map((mood) => {
            const isLastLogged = mood.key === lastMoodKey
            return (
              <TouchableOpacity
                key={mood.key}
                style={[
                  styles.moodBtn, 
                  { borderColor: mood.color + '40', backgroundColor: mood.color + '10' },
                  isLastLogged && { borderColor: mood.color, borderWidth: 2, backgroundColor: mood.color + '20' }
                ]}
                onPress={() => handleAddMoodEntry(mood.key)}
                disabled={!isToday || saving}
              >
                {isLastLogged && (
                  <View style={[styles.moodActiveDot, { backgroundColor: mood.color }]} />
                )}
                <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                <Text style={[styles.moodLabel, {color: mood.color}]}>{mood.label}</Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>
    )
  }

  const renderSentimentCard = () => {
    const sentimentLabel = onDeviceAIService.getSentimentLabel(journal?.currentSentiment || "neutral")
    const gradientColors = onDeviceAIService.getScoreGradient(journal?.currentScore || 50)
    return (
      <View style={styles.sectionContainer}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.sentimentCard}
        >
          <View style={styles.sentimentContent}>
             <Text style={styles.sentimentEmojiLarge}>{journal?.sentimentEmoji || "ðŸ˜"}</Text>
             <View style={styles.sentimentInfo}>
                <Text style={styles.sentimentTitle}>{sentimentLabel}</Text>
                {settings.showDevScore && (
                  <Text style={styles.devScoreText}>AI Score: {journal?.currentScore || 50}</Text>
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
                                        ? `Feeling ${log.moodLabel} ${log.moodEmoji}` 
                                        : log.text
                                }
                                <Text style={styles.inlineTimestamp}>  {formatTime(log.timestamp)}</Text>
                            </Text>
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
                    <View style={[styles.exportIcon, {backgroundColor: '#fee2e2'}]}>
                        <Ionicons name="document-text" size={24} color="#ef4444" />
                    </View>
                    <View>
                        <Text style={styles.exportLabel}>Save as PDF</Text>
                        <Text style={styles.exportSub}>Best for printing</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.exportOption} onPress={generateTextFile}>
                    <View style={[styles.exportIcon, {backgroundColor: '#e0f2fe'}]}>
                        <Ionicons name="document" size={24} color="#0ea5e9" />
                    </View>
                    <View>
                        <Text style={styles.exportLabel}>Save as Text File</Text>
                        <Text style={styles.exportSub}>Best for documents</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.exportOption} onPress={shareAsText}>
                    <View style={[styles.exportIcon, {backgroundColor: '#dcfce7'}]}>
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
                    onChangeText={(text) => {
                        setNewEntryText(text)
                        setWordCount(text.trim() === "" ? 0 : text.trim().split(/\s+/).length)
                    }}
                    autoFocus
                    textAlignVertical="top"
                />
                <View style={styles.wordCountBar}>
                    <Text style={styles.wordCountText}>
                        {wordCount === 0 ? "Start writing..." : `${wordCount} word${wordCount !== 1 ? 's' : ''}`}
                    </Text>
                    {wordCount > 0 && (
                        <Text style={[
                            styles.wordCountBadge,
                            wordCount < 20 ? styles.badgeLow : wordCount < 50 ? styles.badgeMed : styles.badgeHigh
                        ]}>
                            {wordCount < 20 ? "Brief" : wordCount < 50 ? "Good" : "Detailed ✨"}
                        </Text>
                    )}
                </View>
            </View>
        </SafeAreaWrapper>
    </Modal>
  )

  const renderTrendModal = () => {
      const scoreHistory = journal?.scoreHistory || []
      const dataPoints = scoreHistory.map(h => h.score)
      const labels = scoreHistory.map(h => 
          new Date(h.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
      )
      const chartLabels = labels.map((label, index) => {
          if (index === 0 || index === labels.length - 1 || index % Math.ceil(labels.length / 4) === 0) {
              return label;
          }
          return "";
      });

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
                            withInnerLines={true}
                            withOuterLines={false}
                            withVerticalLines={false}
                        />
                    ) : (
                        <View style={styles.noDataContainer}>
                            <Ionicons name="bar-chart-outline" size={48} color="#e2e8f0" />
                            <Text style={styles.noDataText}>Graph requires at least 2 entries to show a trend.</Text>
                        </View>
                    )}
                    {/* Download graph as PDF */}
                    <TouchableOpacity 
                        style={styles.downloadGraphBtn}
                        onPress={generateGraphPDF}
                    >
                        <Ionicons name="download-outline" size={18} color="#3b82f6" />
                        <Text style={styles.downloadGraphText}>Download as PDF</Text>
                    </TouchableOpacity>
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
        <ScrollView ref={scrollViewRef} style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 40}}>
            {loading ? <ActivityIndicator size="large" color="#3b82f6" style={{marginTop: 50}} /> : (
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  iconBtn: { padding: 8, backgroundColor: '#fff', borderRadius: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  dateNavContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 4, borderRadius: 25, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  navArrow: { padding: 8 },
  disabledArrow: { opacity: 0.3 },
  dateDisplay: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
  dateText: { fontSize: 14, fontWeight: '600', color: '#334155' },
  todayDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#3b82f6', marginLeft: 6 },
  content: { flex: 1, paddingHorizontal: 20 },
  sectionContainer: { marginTop: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#64748b', marginBottom: 10, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  journalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingHorizontal: 4 },
  moodList: { paddingRight: 20 },
  moodBtn: { alignItems: 'center', justifyContent: 'center', paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#fff', borderRadius: 16, marginRight: 10, borderWidth: 1 },
  moodEmoji: { fontSize: 22, marginBottom: 4 },
  moodLabel: { fontSize: 10, fontWeight: '600' },
  sentimentCard: { borderRadius: 20, padding: 20, shadowColor: "#3b82f6", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  sentimentContent: { flexDirection: 'row', alignItems: 'center' },
  sentimentEmojiLarge: { fontSize: 40, marginRight: 16 },
  sentimentInfo: { flex: 1 },
  sentimentTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  devScoreText: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  graphBtn: { padding: 10, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12 },
  journalListContainer: { marginTop: 24 },
  journalCard: { backgroundColor: '#fff', borderRadius: 20, padding: 24, minHeight: 300, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { color: '#94a3b8', marginTop: 12, fontSize: 14 },
  entryBlock: { marginBottom: 8 },
  entryText: { fontSize: 16, color: '#334155', lineHeight: 26, textAlign: 'left' },
  deletedText: { color: '#94a3b8', fontStyle: 'italic', fontSize: 14 },
  inlineTimestamp: { fontSize: 11, color: '#94a3b8', fontStyle: 'italic' },
  entryDivider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 12, width: '40%', alignSelf: 'center', opacity: 0.5 },
  writeButton: { backgroundColor: '#3b82f6', borderRadius: 16, paddingVertical: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20, shadowColor: "#3b82f6", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  writeButtonText: { color: '#fff', fontWeight: '600', fontSize: 16, marginLeft: 8 },
  readOnlyBanner: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 12, backgroundColor: '#f8fafc', borderRadius: 12, marginTop: 20 },
  readOnlyText: { color: '#94a3b8', fontSize: 12, marginLeft: 6 },
  editorContainer: { flex: 1, backgroundColor: '#fff' },
  editorHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  closeEditorBtn: { padding: 8 },
  cancelText: { fontSize: 16, color: '#64748b' },
  editorTitle: { fontSize: 18, fontWeight: '600', color: '#1e293b' },
  saveEditorBtn: { backgroundColor: '#3b82f6', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  disabledSave: { backgroundColor: '#93c5fd' },
  saveText: { color: '#fff', fontWeight: '600' },
  editorInput: { flex: 1, padding: 24, fontSize: 18, color: '#334155', lineHeight: 28 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  trendCard: { backgroundColor: '#fff', borderRadius: 24, padding: 24, width: screenWidth - 40 },
  trendHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  trendTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
  noDataContainer: { height: 220, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 16 },
  noDataText: { marginTop: 12, color: '#94a3b8', textAlign: 'center', paddingHorizontal: 20 },
  // Export Modal Styles
  exportCard: { backgroundColor: '#fff', borderRadius: 24, padding: 24, width: screenWidth - 40 },
  exportOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  exportIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  exportLabel: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  exportSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  // Graph download button
  downloadGraphBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16, paddingVertical: 10, backgroundColor: '#eff6ff', borderRadius: 12, gap: 6 },
  downloadGraphText: { fontSize: 14, fontWeight: '600', color: '#3b82f6' },
  // Mood section header
  moodSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingHorizontal: 4 },
  lastMoodNote: { fontSize: 12, color: '#64748b' },
  moodActiveDot: { position: 'absolute', top: 6, right: 6, width: 7, height: 7, borderRadius: 4 },
  // Word count bar
  wordCountBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingBottom: 16, paddingTop: 4 },
  wordCountText: { fontSize: 12, color: '#94a3b8' },
  wordCountBadge: { fontSize: 11, fontWeight: '600', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  badgeLow: { backgroundColor: '#f1f5f9', color: '#94a3b8' },
  badgeMed: { backgroundColor: '#dcfce7', color: '#16a34a' },
  badgeHigh: { backgroundColor: '#dbeafe', color: '#2563eb' },
})