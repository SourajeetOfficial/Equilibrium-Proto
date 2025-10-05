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
import { useSafeAreaInsets } from "react-native-safe-area-context"
import SafeAreaWrapper from "../components/SafeAreaWrapper"
import localStorageService from "../services/localStorageService"
import behavioralTrackingService from "../services/behavioralTrackingService"

export default function Tracker({ navigation }) {
  const insets = useSafeAreaInsets()
  const [data, setData] = useState({
    todayStats: [],
    sleepData: [],
    digitalData: [],
    appUsage: [],
    insights: [],
  });
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();       // reload tracker data
    await fetchSleepWindow(); // reload sleep window
    setRefreshing(false);
  };
  // Sleep window states
  const [sleepWindow, setSleepWindow] = useState({ bedtime: null, wakeup: null })
  const [modalVisible, setModalVisible] = useState(false)
  const [tempBedtime, setTempBedtime] = useState(new Date())
  const [tempWakeup, setTempWakeup] = useState(new Date())
  const [pickerMode, setPickerMode] = useState(null)

  useEffect(() => {
    fetchSleepWindow()
  }, [])

  useEffect(() => {
    fetchData()
  }, [sleepWindow])

  const fetchData = async () => {
    setLoading(true)
    try {
      const wellnessData = await localStorageService.getWellnessData(1)
      const usageStats = await behavioralTrackingService.getDailyUsageStats()
      const todayWellness = wellnessData[0]

      const formattedData = {
        todayStats: [
          {
            icon: "moon",
            value: todayWellness?.sleepHours
              ? `${Math.floor(todayWellness.sleepHours)}h ${Math.round((todayWellness.sleepHours % 1) * 60)}m`
              : "Not tracked",
            label: "Sleep",
            color: "#6366f1",
            bgColor: "#e0e7ff",
          },
          {
            icon: "phone-portrait",
            value: usageStats?.screenTimeMinutes
              ? `${Math.floor(usageStats.screenTimeMinutes)}h ${usageStats.screenTimeMinutes % 60}m`
              : "Not tracked",
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
        sleepData: [
          {
            label: "Last night",
            value: todayWellness?.sleepHours
              ? `${Math.floor(todayWellness.sleepHours)}h ${Math.round((todayWellness.sleepHours % 1) * 60)}m`
              : "Not tracked",
            bgColor: "#e0e7ff",
            textColor: "#6366f1",
          },
          {
            label: "Bedtime",
            value: formatTime(sleepWindow.bedtime || new Date().setHours(23, 0, 0)),
            bgColor: "#dbeafe",
            textColor: "#3b82f6",
          },
          {
            label: "Wake-up",
            value: formatTime(sleepWindow.wakeup || new Date().setHours(7, 0, 0)),
            bgColor: "#ede9fe",
            textColor: "#8b5cf6",
          },
        ],
        digitalData: [
          {
            label: "Screen time today",
            value: data?.appUsage && data.appUsage.length > 0
              ? formatDuration(
                  data.appUsage.reduce((sum, app) => sum + (app.durationMinutes || 0), 0)
                )
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
    const m = Math.round(minutes % 60); // round minutes for approximation
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const fetchSleepWindow = async () => {
    try {
      const saved = await localStorageService.getItem("sleepWindow")
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
    await localStorageService.setItem("sleepWindow", newWindow)
    setModalVisible(false)
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
        {/* Header */}
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

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false} refreshControl={
    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}> 
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

          {/* Sleep Tracking */}
          <View style={styles.trackingCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleContainer}>
                <Ionicons name="moon" size={20} color="#6366f1" />
                <Text style={styles.cardTitle}>Sleep Patterns</Text>
              </View>
            </View>
            <View style={styles.cardContent}>
              {data.sleepData.map((item, index) => (
                <View key={index} style={[styles.dataRow, { backgroundColor: item.bgColor }]}>
                  <Text style={styles.dataLabel}>{item.label}</Text>
                  <Text style={[styles.dataValue, { color: item.textColor }]}>{item.value}</Text>
                </View>
              ))}
              <TouchableOpacity style={styles.logButton} onPress={() => setModalVisible(true)}>
                <Ionicons name="time" size={16} color="#6366f1" />
                <Text style={styles.logButtonText}>Set Sleep Window</Text>
              </TouchableOpacity>
            </View>
          </View>

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
                  <Text style={styles.appUsageTitle}>App Usage Today</Text>
                  {data.appUsage.map((app, index) => (
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


          {/* Weekly Progress */}
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>This Week's Progress</Text>
              <TouchableOpacity onPress={() => navigation.navigate("Reports")}>
                <Text style={styles.viewDetailsText}>View Details</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.progressItems}>
              <View style={styles.progressItem}>
                <View style={[styles.progressDot, { backgroundColor: "#10b981" }]} />
                <Text style={styles.progressText}>Sleep quality improving</Text>
              </View>
              <View style={styles.progressItem}>
                <View style={[styles.progressDot, { backgroundColor: "#3b82f6" }]} />
                <Text style={styles.progressText}>More consistent bedtime</Text>
              </View>
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

            <Text style={styles.modalLabel}>Bedtime</Text>
            <TouchableOpacity onPress={() => setPickerMode("bedtime")} style={styles.timeButton}>
              <Text style={styles.timeButtonText}>{formatTime(tempBedtime)}</Text>
            </TouchableOpacity>

            <Text style={styles.modalLabel}>Wake-up</Text>
            <TouchableOpacity onPress={() => setPickerMode("wakeup")} style={styles.timeButton}>
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
    </SafeAreaWrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statusBarBg: {
    height: 0,
    backgroundColor: "#f3e8ff",
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
  iconButton: {
    width: 40,
    height: 40,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
  },
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
  statValue: {
    fontSize: 18,
    fontWeight: "300",
    color: "#374151",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#6b7280",
  },
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
  },
  cardTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "500",
    color: "#374151",
  },
  cardContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  dataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
  },
  dataLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  dataValue: {
    fontSize: 14,
    fontWeight: "500",
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
  logButtonText: {
    fontSize: 14,
    color: "#6366f1",
    fontWeight: "500",
  },
  insightCard: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 4,
  },
  insightText: {
    fontSize: 12,
    color: "#6b7280",
  },
  appUsageContainer: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  appUsageTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  appRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  appName: {
    fontSize: 14,
    color: "#374151",
  },
  appDuration: {
    fontSize: 14,
    fontWeight: "500",
    color: "#10b981",
  },
  progressCard: {
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  viewDetailsText: {
    fontSize: 14,
    color: "#8b5cf6",
    fontWeight: "500",
  },
  progressItems: {
    gap: 8,
  },
  progressItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: "#6b7280",
  },
  bottomAction: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  goalButton: {
    backgroundColor: "#8b5cf6",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  goalButtonText: {
    fontSize: 16,
    color: "#ffffff",
    fontWeight: "500",
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
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  modalLabel: {
    fontSize: 14,
    marginTop: 12,
    marginBottom: 6,
    color: "#374151",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 20,
    gap: 12,
  },
  cancelBtn: {
    padding: 10,
  },
  cancelText: {
    color: "#6b7280",
    fontSize: 14,
  },
  saveBtn: {
    backgroundColor: "#6366f1",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  saveText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
   appUsageContainer: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  appUsageTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  appRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  appName: {
    flex: 1,
    fontSize: 14,
    color: "#374151",
  },
  durationBarContainer: {
    flex: 2,
    height: 6,
    backgroundColor: "#e5e7eb",
    borderRadius: 3,
    marginHorizontal: 8,
  },
  durationBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10b981",
  },
  appDuration: {
    width: 60,
    fontSize: 12,
    fontWeight: "500",
    color: "#10b981",
    textAlign: "right",
  },
})
