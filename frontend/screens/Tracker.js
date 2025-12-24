"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native"
import DateTimePicker from "@react-native-community/datetimepicker"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
import SafeAreaWrapper from "../components/SafeAreaWrapper"
import localStorageService from "../services/localStorageService"
import behavioralTrackingService from "../services/behavioralTrackingService"

export default function Tracker({ navigation }) {
  const [data, setData] = useState({
    todayStats: [],
    sleepData: [],
    digitalData: [],
    appUsage: [],
    insights: [],
  });
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false);

  // Sleep tracking preference
  const [sleepTrackingMode, setSleepTrackingMode] = useState("screen_usage") // "screen_usage" or "fitness_band"
  const [fitnessConnected, setFitnessConnected] = useState(false)

  // Sleep window states
  const [sleepWindow, setSleepWindow] = useState({ bedtime: null, wakeup: null })
  const [modalVisible, setModalVisible] = useState(false)
  const [tempBedtime, setTempBedtime] = useState(new Date())
  const [tempWakeup, setTempWakeup] = useState(new Date())
  const [pickerMode, setPickerMode] = useState(null)

  // Sleep mode selection modal
  const [modeModalVisible, setModeModalVisible] = useState(false)

  useEffect(() => {
    fetchSleepWindow()
    fetchSleepPreference()
  }, [])

  useEffect(() => {
    fetchData()
  }, [sleepWindow, sleepTrackingMode])

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    await fetchSleepWindow();
    await fetchSleepPreference();
    setRefreshing(false);
  };

  const fetchSleepPreference = async () => {
    try {
      const prefs = await localStorageService.getSleepPreferences()
      if (prefs) {
        setSleepTrackingMode(prefs.mode || "screen_usage")
        setFitnessConnected(prefs.fitnessConnected || false)
      }
    } catch (e) {
      console.log("No saved sleep preference")
    }
  }

  const saveSleepPreference = async (mode, connected = fitnessConnected) => {
    const prefs = { mode, fitnessConnected: connected }
    await localStorageService.saveSleepPreferences(prefs)
    setSleepTrackingMode(mode)
    setFitnessConnected(connected)
    setModeModalVisible(false)
    await fetchData()
  }

  const connectFitnessBand = async () => {
    try {
      // Request Health Connect permission
      const granted = await behavioralTrackingService.requestHealthConnectPermission?.()
      
      if (granted) {
        setFitnessConnected(true)
        await saveSleepPreference("fitness_band", true)
        Alert.alert("Success", "Fitness band connected successfully!")
      } else {
        Alert.alert(
          "Permission Required",
          "Please enable Health Connect permissions in your device settings to track sleep data from your fitness band."
        )
      }
    } catch (error) {
      console.error("Error connecting fitness band:", error)
      Alert.alert("Error", "Failed to connect fitness band. Please try again.")
    }
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const wellnessData = await localStorageService.getWellnessData(1)
      const usageStats = await behavioralTrackingService.getDailyUsageStats()
      const todayWellness = wellnessData[0]

      const appUsage = usageStats?.appUsage || [];
      
      const totalUsageMinutes = appUsage.reduce(
        (sum, app) => sum + (app.durationMinutes || 0),
        0
      );

      // Get sleep data based on mode
      let sleepHours = 0
      let sleepSource = "Not tracked"
      let sleepConfidence = 0

      if (sleepTrackingMode === "fitness_band" && fitnessConnected) {
        // Use fitness band data
        const fitnessData = await localStorageService.getFitnessSleepData(1)
        if (fitnessData && fitnessData.length > 0) {
          sleepHours = fitnessData[0].sleepHours || 0
          sleepSource = "Fitness Band"
          sleepConfidence = fitnessData[0].confidence || 0.95
        }
      } else {
        // Use screen usage estimation
        const screenSleepData = await localStorageService.getScreenUsageSleepData(1)
        if (screenSleepData && screenSleepData.length > 0) {
          sleepHours = screenSleepData[0].estimatedSleepHours || 0
          sleepSource = "Screen Usage"
          sleepConfidence = screenSleepData[0].confidence || 0.6
        } else if (usageStats?.sleepData) {
          sleepHours = usageStats.sleepData.estimatedSleepMinutes / 60
          sleepSource = "Screen Usage"
          sleepConfidence = usageStats.sleepData.confidence || 0.6
        }
      }

      const formattedData = {
        todayStats: [
          {
            icon: "moon",
            value: sleepHours > 0
              ? `${Math.floor(sleepHours)}h ${Math.round((sleepHours % 1) * 60)}m`
              : "Not tracked",
            label: "Sleep",
            color: "#6366f1",
            bgColor: "#e0e7ff",
          },
          {
            icon: "phone-portrait",
            value: totalUsageMinutes > 0 ? formatDuration(totalUsageMinutes): "Not tracked",
            label: "Screen",
            color: "#10b981",
            bgColor: "#d1fae5",
          },
          {
            icon: "trending-up",
            value: todayWellness?.wellnessScore ? `${todayWellness.wellnessScore}%` : "Not tracked",
            label: "Score",
            color: "#f59e0b",
            bgColor: "#fef3c7",
          },
        ],
        sleepData: {
          hours: sleepHours,
          source: sleepSource,
          confidence: sleepConfidence,
          bedtime: sleepWindow.bedtime,
          wakeup: sleepWindow.wakeup,
        },
        digitalData: [
          {
            label: "Screen time today",
            value: totalUsageMinutes > 0
              ? formatDuration(totalUsageMinutes)
              : "Not tracked",
            bgColor: "#d1fae5",
            textColor: "#10b981",
          },
          {
            label: "App pickups",
            value: usageStats?.pickupCount ? `${usageStats.pickupCount} times` : "Not tracked",
            bgColor: "#ccfbf1",
            textColor: "#14b8a6",
          },
        ],
        appUsage: usageStats?.appUsage || [],
        insights: [
          {
            title: "Today's Insight",
            text: "20% less screen time than yesterday - great progress!",
            bgColor: "rgba(16, 185, 129, 0.1)",
            color: "#374151",
          },
        ],
      }

      setData(formattedData)
    } catch (error) {
      console.error("Error fetching tracker data:", error)
      Alert.alert("Error", "Failed to fetch tracker data.")
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (minutes) => {
    if (!minutes || minutes <= 0) return "0m";
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const fetchSleepWindow = async () => {
    try {
      const saved = await localStorageService.getSleepWindow()
      if (saved) {
        setSleepWindow(saved)
        setTempBedtime(new Date(saved.bedtime))
        setTempWakeup(new Date(saved.wakeup))
      }
    } catch (e) {
      console.log("No saved sleep window")
    }
  }

  const saveSleepWindow = async () => {
    const newWindow = { bedtime: tempBedtime, wakeup: tempWakeup }
    setSleepWindow(newWindow)
    await localStorageService.saveSleepWindow(newWindow)
    
    // Also update behavioral tracking service
    const bedtimeStr = `${tempBedtime.getHours()}:${tempBedtime.getMinutes().toString().padStart(2, '0')}`
    const wakeupStr = `${tempWakeup.getHours()}:${tempWakeup.getMinutes().toString().padStart(2, '0')}`
    await behavioralTrackingService.setUserSleepWindow(bedtimeStr, wakeupStr)
    
    setModalVisible(false)
    await fetchData()
  }

  const formatTime = (date) => {
    if (!date) return "Not set"
    const d = new Date(date)
    let hours = d.getHours()
    let minutes = d.getMinutes()
    const ampm = hours >= 12 ? "PM" : "AM"
    hours = hours % 12 || 12
    return `${hours}:${minutes.toString().padStart(2, "0")} ${ampm}`
  }

  const renderSleepCard = () => {
    if (sleepTrackingMode === "fitness_band") {
      return renderFitnessBandSleepCard()
    } else {
      return renderScreenUsageSleepCard()
    }
  }

  const renderFitnessBandSleepCard = () => (
    <View style={styles.trackingCard}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleContainer}>
          <Ionicons name="watch" size={20} color="#6366f1" />
          <Text style={styles.cardTitle}>Sleep Patterns (Fitness Band)</Text>
        </View>
        <TouchableOpacity onPress={() => setModeModalVisible(true)}>
          <Ionicons name="swap-horizontal" size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>
      <View style={styles.cardContent}>
        {fitnessConnected ? (
          <>
            <View style={[styles.dataRow, { backgroundColor: "#e0e7ff" }]}>
              <Text style={styles.dataLabel}>Last night</Text>
              <Text style={[styles.dataValue, { color: "#6366f1" }]}>
                {data.sleepData.hours > 0
                  ? `${Math.floor(data.sleepData.hours)}h ${Math.round((data.sleepData.hours % 1) * 60)}m`
                  : "No data"}
              </Text>
            </View>
            <View style={[styles.dataRow, { backgroundColor: "#dbeafe" }]}>
              <Text style={styles.dataLabel}>Source</Text>
              <View style={styles.sourceContainer}>
                <View style={styles.confidenceDot} />
                <Text style={[styles.dataValue, { color: "#3b82f6" }]}>
                  {data.sleepData.source}
                </Text>
              </View>
            </View>
            <View style={[styles.dataRow, { backgroundColor: "#f0fdf4" }]}>
              <Text style={styles.dataLabel}>Accuracy</Text>
              <Text style={[styles.dataValue, { color: "#10b981" }]}>
                {Math.round(data.sleepData.confidence * 100)}%
              </Text>
            </View>
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={16} color="#6366f1" />
              <Text style={styles.infoText}>
                Sleep data synced from your fitness device
              </Text>
            </View>
          </>
        ) : (
          <View style={styles.connectContainer}>
            <Ionicons name="watch-outline" size={48} color="#cbd5e1" />
            <Text style={styles.connectTitle}>No Device Connected</Text>
            <Text style={styles.connectDescription}>
              Connect your fitness band to track accurate sleep data
            </Text>
            <TouchableOpacity style={styles.connectButton} onPress={connectFitnessBand}>
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text style={styles.connectButtonText}>Connect Device</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.switchModeButton} 
              onPress={() => saveSleepPreference("screen_usage")}
            >
              <Text style={styles.switchModeText}>Use Screen Usage Instead</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  )

  const renderScreenUsageSleepCard = () => (
    <View style={styles.trackingCard}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleContainer}>
          <Ionicons name="moon" size={20} color="#6366f1" />
          <Text style={styles.cardTitle}>Sleep Patterns (Estimated)</Text>
        </View>
        <TouchableOpacity onPress={() => setModeModalVisible(true)}>
          <Ionicons name="swap-horizontal" size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>
      <View style={styles.cardContent}>
        <View style={[styles.dataRow, { backgroundColor: "#e0e7ff" }]}>
          <Text style={styles.dataLabel}>Estimated sleep</Text>
          <Text style={[styles.dataValue, { color: "#6366f1" }]}>
            {data.sleepData.hours > 0
              ? `${Math.floor(data.sleepData.hours)}h ${Math.round((data.sleepData.hours % 1) * 60)}m`
              : "Not tracked"}
          </Text>
        </View>
        <View style={[styles.dataRow, { backgroundColor: "#dbeafe" }]}>
          <Text style={styles.dataLabel}>Bedtime window</Text>
          <Text style={[styles.dataValue, { color: "#3b82f6" }]}>
            {formatTime(sleepWindow.bedtime || new Date().setHours(23, 0, 0))}
          </Text>
        </View>
        <View style={[styles.dataRow, { backgroundColor: "#ede9fe" }]}>
          <Text style={styles.dataLabel}>Wake-up window</Text>
          <Text style={[styles.dataValue, { color: "#8b5cf6" }]}>
            {formatTime(sleepWindow.wakeup || new Date().setHours(7, 0, 0))}
          </Text>
        </View>
        <View style={[styles.dataRow, { backgroundColor: "#fef3c7" }]}>
          <Text style={styles.dataLabel}>Estimation accuracy</Text>
          <Text style={[styles.dataValue, { color: "#f59e0b" }]}>
            {Math.round(data.sleepData.confidence * 100)}%
          </Text>
        </View>
        <TouchableOpacity style={styles.logButton} onPress={() => setModalVisible(true)}>
          <Ionicons name="time" size={16} color="#6366f1" />
          <Text style={styles.logButtonText}>Adjust Sleep Window</Text>
        </TouchableOpacity>
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={16} color="#f59e0b" />
          <Text style={styles.infoText}>
            Sleep estimated from screen inactivity during your set window
          </Text>
        </View>
      </View>
    </View>
  )

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text style={styles.loadingText}>Loading data...</Text>
      </View>
    )
  }

  return (
    <SafeAreaWrapper backgroundColor="#dbeafe" statusBarStyle="dark-content">
      <View style={styles.statusBarBg} />
      <LinearGradient colors={["#f3e8ff", "#e9d5ff"]} style={styles.gradient}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={20} color="#64748b" />
            </TouchableOpacity>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Wellness Tracking</Text>
              <Text style={styles.headerSubtitle}>Understanding your patterns</Text>
            </View>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="calendar-outline" size={20} color="#64748b" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false} 
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Today's Summary */}
          <View style={styles.section}>
            <View style={styles.statsGrid}>
              {data.todayStats.map((stat, index) => (
                <View key={index} style={styles.statCard}>
                  <View style={[styles.statIcon, { backgroundColor: stat.bgColor }]}>
                    <Ionicons name={stat.icon} size={20} color={stat.color} />
                  </View>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Sleep Tracking - Dynamic based on mode */}
          {renderSleepCard()}

          {/* Digital Wellness */}
          <View style={styles.trackingCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleContainer}>
                <Ionicons name="phone-portrait" size={20} color="#10b981" />
                <Text style={styles.cardTitle}>Digital Wellness</Text>
              </View>
            </View>
            <View style={styles.cardContent}>
              {data.digitalData.map((item, index) => (
                <View key={index} style={[styles.dataRow, { backgroundColor: item.bgColor }]}>
                  <Text style={styles.dataLabel}>{item.label}</Text>
                  <Text style={[styles.dataValue, { color: item.textColor }]}>
                    {item.value}
                  </Text>
                </View>
              ))}

              {data.appUsage.length > 0 && (
                <View style={styles.appUsageContainer}>
                  <Text style={styles.appUsageTitle}>Top Apps Today</Text>
                  {data.appUsage.slice(0, 5).map((app, index) => (
                    <View key={index} style={styles.appRow}>
                      <Text style={styles.appName}>{app.appName || app.package}</Text>
                      <Text style={styles.appDuration}>
                        {formatDuration(app.durationMinutes)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {data.insights.length > 0 && (
                <View style={styles.insightCard}>
                  <Text style={styles.insightTitle}>{data.insights[0].title}</Text>
                  <Text style={styles.insightText}>{data.insights[0].text}</Text>
                </View>
              )}
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </LinearGradient>

      {/* Sleep Window Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set Sleep Window</Text>
            <Text style={styles.modalSubtitle}>
              Define your typical sleep schedule for better tracking
            </Text>

            <Text style={styles.modalLabel}>Bedtime</Text>
            <TouchableOpacity onPress={() => setPickerMode("bedtime")} style={styles.timeButton}>
              <Ionicons name="moon-outline" size={20} color="#6366f1" />
              <Text style={styles.timeButtonText}>{formatTime(tempBedtime)}</Text>
            </TouchableOpacity>

            <Text style={styles.modalLabel}>Wake-up</Text>
            <TouchableOpacity onPress={() => setPickerMode("wakeup")} style={styles.timeButton}>
              <Ionicons name="sunny-outline" size={20} color="#f59e0b" />
              <Text style={styles.timeButtonText}>{formatTime(tempWakeup)}</Text>
            </TouchableOpacity>

            {pickerMode && (
              <DateTimePicker
                value={pickerMode === "bedtime" ? tempBedtime : tempWakeup}
                mode="time"
                is24Hour={false}
                display="default"
                onChange={(event, selectedDate) => {
                  if (selectedDate) {
                    if (pickerMode === "bedtime") setTempBedtime(selectedDate)
                    if (pickerMode === "wakeup") setTempWakeup(selectedDate)
                  }
                  setPickerMode(null)
                }}
              />
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveSleepWindow}>
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Sleep Mode Selection Modal */}
      <Modal visible={modeModalVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sleep Tracking Method</Text>
            <Text style={styles.modalSubtitle}>
              Choose how you want to track your sleep
            </Text>

            <TouchableOpacity
              style={[
                styles.modeOption,
                sleepTrackingMode === "fitness_band" && styles.modeOptionSelected
              ]}
              onPress={() => {
                if (fitnessConnected) {
                  saveSleepPreference("fitness_band")
                } else {
                  setModeModalVisible(false)
                  setTimeout(() => connectFitnessBand(), 300)
                }
              }}
            >
              <View style={styles.modeOptionContent}>
                <View style={[styles.modeIcon, { backgroundColor: "#e0e7ff" }]}>
                  <Ionicons name="watch" size={24} color="#6366f1" />
                </View>
                <View style={styles.modeTextContainer}>
                  <Text style={styles.modeTitle}>Fitness Band</Text>
                  <Text style={styles.modeDescription}>
                    Accurate data from your wearable device
                  </Text>
                  {!fitnessConnected && (
                    <Text style={styles.modeStatus}>Not connected</Text>
                  )}
                </View>
              </View>
              {sleepTrackingMode === "fitness_band" && (
                <Ionicons name="checkmark-circle" size={24} color="#6366f1" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modeOption,
                sleepTrackingMode === "screen_usage" && styles.modeOptionSelected
              ]}
              onPress={() => saveSleepPreference("screen_usage")}
            >
              <View style={styles.modeOptionContent}>
                <View style={[styles.modeIcon, { backgroundColor: "#fef3c7" }]}>
                  <Ionicons name="phone-portrait" size={24} color="#f59e0b" />
                </View>
                <View style={styles.modeTextContainer}>
                  <Text style={styles.modeTitle}>Screen Usage</Text>
                  <Text style={styles.modeDescription}>
                    Estimate sleep from phone inactivity
                  </Text>
                </View>
              </View>
              {sleepTrackingMode === "screen_usage" && (
                <Ionicons name="checkmark-circle" size={24} color="#10b981" />
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.modalCloseBtn} 
              onPress={() => setModeModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaWrapper>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  statusBarBg: { height: 0, backgroundColor: "#f3e8ff" },
  gradient: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 16 },
  headerContent: { flexDirection: "row", alignItems: "center", gap: 12 },
  backButton: {
    width: 40,
    height: 40,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: "300", color: "#374151" },
  headerSubtitle: { fontSize: 14, color: "#6b7280" },
  iconButton: {
    width: 40,
    height: 40,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  content: { flex: 1, paddingHorizontal: 16 },
  section: { marginBottom: 16 },
  statsGrid: { flexDirection: "row", gap: 12 },
  statCard: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statValue: { fontSize: 18, fontWeight: "300", color: "#374151", marginBottom: 4 },
  statLabel: { fontSize: 12, color: "#6b7280" },
  trackingCard: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    padding: 16,
    paddingBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitleContainer: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardTitle: { fontSize: 18, fontWeight: "500", color: "#374151" },
  cardContent: { paddingHorizontal: 16, paddingBottom: 16, gap: 12 },
  dataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
  },
  dataLabel: { fontSize: 14, color: "#6b7280" },
  dataValue: { fontSize: 14, fontWeight: "500" },
  sourceContainer: { flexDirection: "row", alignItems: "center", gap: 6 },
  confidenceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10b981",
  },
  logButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#c7d2fe",
    backgroundColor: "transparent",
    marginTop: 8,
  },
  logButtonText: { fontSize: 14, color: "#6366f1", fontWeight: "500" },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(99, 102, 241, 0.05)",
    padding: 12,
    borderRadius: 8,
    marginTop: 4,
  },
  infoText: { flex: 1, fontSize: 12, color: "#6b7280", lineHeight: 16 },
  connectContainer: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 12,
  },
  connectTitle: { fontSize: 16, fontWeight: "500", color: "#374151" },
  connectDescription: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  connectButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#6366f1",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 8,
  },
  connectButtonText: { fontSize: 14, color: "#fff", fontWeight: "500" },
  switchModeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  switchModeText: { fontSize: 13, color: "#6366f1", textDecorationLine: "underline" },
  appUsageContainer: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  appUsageTitle: { fontSize: 14, fontWeight: "500", color: "#374151", marginBottom: 8 },
  appRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  appName: { fontSize: 14, color: "#374151", flex: 1 },
  appDuration: { fontSize: 14, fontWeight: "500", color: "#10b981" },
  insightCard: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  insightTitle: { fontSize: 14, fontWeight: "500", color: "#374151", marginBottom: 4 },
  insightText: { fontSize: 12, color: "#6b7280" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { fontSize: 16, color: "#6b7280", marginTop: 16 },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "90%",
    maxWidth: 400,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: { fontSize: 20, fontWeight: "600", marginBottom: 8, textAlign: "center", color: "#374151" },
  modalSubtitle: { fontSize: 14, color: "#6b7280", textAlign: "center", marginBottom: 20 },
  modalLabel: { fontSize: 14, marginTop: 12, marginBottom: 8, color: "#374151", fontWeight: "500" },
  timeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#f9fafb",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  timeButtonText: { fontSize: 16, color: "#374151", fontWeight: "500" },
  modalButtons: { flexDirection: "row", justifyContent: "flex-end", marginTop: 24, gap: 12 },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 16 },
  cancelText: { color: "#6b7280", fontSize: 14, fontWeight: "500" },
  saveBtn: { backgroundColor: "#6366f1", paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8 },
  saveText: { color: "#fff", fontSize: 14, fontWeight: "500" },
  modeOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f9fafb",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#e5e7eb",
  },
  modeOptionSelected: {
    borderColor: "#6366f1",
    backgroundColor: "rgba(99, 102, 241, 0.05)",
  },
  modeOptionContent: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  modeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  modeTextContainer: { flex: 1 },
  modeTitle: { fontSize: 16, fontWeight: "500", color: "#374151", marginBottom: 4 },
  modeDescription: { fontSize: 13, color: "#6b7280" },
  modeStatus: { fontSize: 12, color: "#f59e0b", marginTop: 4, fontStyle: "italic" },
  modalCloseBtn: {
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 8,
  },
  modalCloseText: { fontSize: 14, color: "#6b7280", fontWeight: "500" },
})