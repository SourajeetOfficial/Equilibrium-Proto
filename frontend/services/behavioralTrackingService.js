// BehavioralTrackingService.js

import { AppState, Alert, NativeModules, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import authService from "./authService";
import localStorageService from "./localStorageService";

const { UsageStatsModule, HealthConnectModule, ActivityRecognitionModule } = NativeModules;

class BehavioralTrackingService {
  constructor() {
    this.isTracking = false;
    this.consentGiven = false;
    this.canTrackDeviceUsage = false;
    this.canTrackHealthData = false;
    this.appStateSubscription = null;
    this.screenTimeTimer = null;

    // Sleep defaults
    this.defaultSleepStart = "22:00";
    this.defaultSleepEnd = "08:00";
    this.userSleepWindow = null;
  }

  // -----------------------------
  // Sleep Window Management
  // -----------------------------
  async setUserSleepWindow(start, end) {
    this.userSleepWindow = { start, end };
    await AsyncStorage.setItem(
      "userSleepWindow",
      JSON.stringify(this.userSleepWindow)
    );
  }

  async loadUserSleepWindow() {
    const saved = await AsyncStorage.getItem("userSleepWindow");
    this.userSleepWindow = saved ? JSON.parse(saved) : null;
  }

  getEffectiveSleepWindow() {
    return this.userSleepWindow || {
      start: this.defaultSleepStart,
      end: this.defaultSleepEnd,
    };
  }

  // -----------------------------
  // Permissions - Usage Stats
  // -----------------------------
  async requestUsageStatsPermission() {
    if (Platform.OS !== "android" || !UsageStatsModule) return false;

    try {
      const granted = await UsageStatsModule.requestPermission();
      this.canTrackDeviceUsage = granted;
      return granted;
    } catch (e) {
      console.error("Usage permission error:", e);
      this.canTrackDeviceUsage = false;
      return false;
    }
  }

  // -----------------------------
  // Permissions - Health Connect
  // -----------------------------
  async requestHealthConnectPermission() {
    if (Platform.OS !== "android" || !HealthConnectModule) {
      console.log("Health Connect not available on this platform");
      return false;
    }

    try {
      // Check if Health Connect is available
      const isAvailable = await HealthConnectModule.isAvailable();
      if (!isAvailable) {
        console.log("Health Connect is not installed on this device");
        return false;
      }

      // Request permissions for sleep data
      const granted = await HealthConnectModule.requestPermissions([
        "SLEEP_SESSION",
        "SLEEP_STAGE"
      ]);
      
      this.canTrackHealthData = granted;
      return granted;
    } catch (e) {
      console.error("Health Connect permission error:", e);
      this.canTrackHealthData = false;
      return false;
    }
  }

  async checkHealthConnectPermission() {
    if (Platform.OS !== "android" || !HealthConnectModule) return false;

    try {
      const hasPermission = await HealthConnectModule.hasPermissions([
        "SLEEP_SESSION",
        "SLEEP_STAGE"
      ]);
      this.canTrackHealthData = hasPermission;
      return hasPermission;
    } catch (e) {
      console.error("Check Health Connect permission error:", e);
      return false;
    }
  }

  // -----------------------------
  // Physical Activity (Device-based)
  // -----------------------------

  async getTodayActivityMinutes() {
    const today = new Date().toISOString().split("T")[0]

    // 1️⃣ Manual override
    const manual = await localStorageService.getManualActivity(today)
    if (manual > 0) return manual

    // 2️⃣ Sensor-based
    if (Platform.OS === "android" && ActivityRecognitionModule) {
      try {
        const granted = await ActivityRecognitionModule.requestPermission()
        if (granted) {
          const minutes = await ActivityRecognitionModule.getTodayActivityMinutes()
          await localStorageService.saveActivityData(today, {
            minutes,
            source: "sensor"
          })
          return minutes
        }
      } catch {}
    }

    return 0
  }

  // -----------------------------
  // Initialization
  // -----------------------------
  async initializeTracking() {
    await this.loadUserSleepWindow();
    await ActivityRecognitionModule?.startTracking?.()
    
    const user = authService.getCurrentUser();
    if (!user?.consentFlags?.usageTracking) return;

    this.consentGiven = true;
    
    // Request usage stats permission
    const usageGranted = await this.requestUsageStatsPermission();
    if (!usageGranted) {
      Alert.alert(
        "Permission Required",
        "Enable Usage Access for Equilibrium in system settings."
      );
      return;
    }

    // Check if user has fitness tracking enabled
    const sleepPrefs = await localStorageService.getSleepPreferences();
    if (sleepPrefs.mode === "fitness_band") {
      await this.checkHealthConnectPermission();
    }

    this.startTracking();
  }

  // -----------------------------
  // Tracking (lightweight fallback)
  // -----------------------------
  startTracking() {
    if (this.isTracking) return;
    this.isTracking = true;

    this.appStateSubscription = AppState.addEventListener("change", () => {});
    this.screenTimeTimer = setInterval(() => {}, 60 * 1000);
  }

  stopTracking() {
    this.isTracking = false;
    this.appStateSubscription?.remove();
    if (this.screenTimeTimer) clearInterval(this.screenTimeTimer);
  }

  // -----------------------------
  // Usage Stats (SOURCE OF TRUTH)
  // -----------------------------
  async getDailyUsageStats() {
    if (!this.consentGiven || !this.canTrackDeviceUsage || !UsageStatsModule) {
      return this.emptyUsage();
    }

    try {
      const usage = await UsageStatsModule.getUsageStats();
      const apps = Array.isArray(usage.apps) ? usage.apps : [];

      // Sort by usage DESC
      apps.sort((a, b) => b.durationMinutes - a.durationMinutes);

      const screenTimeMinutes = Math.round((usage.totalScreenTime || 0) / 60);

      // Get sleep data based on user preference
      const sleepData = await this.getSleepDataFromUsage(usage)

      const activityMinutes = await this.getTodayActivityMinutes()


      // Save screen usage sleep estimation
      if (sleepData.source === "inactivity") {
        const today = new Date().toISOString().split("T")[0]
        await localStorageService.saveScreenUsageSleepData(today, {
          estimatedSleepMinutes: sleepData.estimatedSleepMinutes,
          estimatedSleepHours: sleepData.estimatedSleepMinutes / 60,
          confidence: sleepData.confidence,
          sleepWindow: this.getEffectiveSleepWindow(),
        });
      }


      return {
        screenTimeMinutes,
        pickupCount: usage.pickupCount || 0,
        activityMinutes,
        appUsage: apps.map(app => ({
          appName: app.appName || app.package,
          package: app.package,
          durationMinutes: Math.round(app.durationMinutes || 0),
        })),
        sleepData,
      };
    } catch (e) {
      console.error("Native usage error:", e);
      return this.emptyUsage();
    }
  }

  emptyUsage() {
    return {
      screenTimeMinutes: 0,
      pickupCount: 0,
      activityMinutes: 0,
      appUsage: [],
      sleepData: {
        source: "none",
        estimatedSleepMinutes: 0,
        confidence: 0,
      },
    };
  }

  // -----------------------------
  // Sleep Resolution (Priority System)
  // -----------------------------
  async getSleepDataFromUsage(usage) {
    const prefs = await localStorageService.getSleepPreferences()

    // Priority 1: Fitness band
    if (prefs.mode === "fitness_band" && prefs.fitnessConnected) {
      const hc = await this.getHealthConnectSleepData()
      if (hc) return hc
    }

    // Fallback: inactivity-based estimation
    return this.calculateSleepDataFromEvents(usage.events)
  }


  // -----------------------------
  // Health Connect Sleep Data
  // -----------------------------
  async getHealthConnectSleepData() {
    if (Platform.OS !== "android" || !HealthConnectModule) return null;

    try {
      // Check permission first
      const hasPermission = await this.checkHealthConnectPermission();
      if (!hasPermission) {
        console.log("No Health Connect permission");
        return null;
      }

      // Get sleep data from yesterday to now
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000);

      const sleepSessions = await HealthConnectModule.readSleepSessions(
        startTime.toISOString(),
        endTime.toISOString()
      );

      if (!sleepSessions || sleepSessions.length === 0) {
        console.log("No sleep sessions found");
        return null;
      }

      // Get the most recent sleep session
      const latestSession = sleepSessions[0];
      
      if (latestSession && latestSession.durationMinutes > 0) {
        return {
          source: "health_connect",
          estimatedSleepMinutes: Math.round(latestSession.durationMinutes),
          confidence: latestSession.confidence ?? 0.95,
          stages: latestSession.stages || [],
          startTime: latestSession.startTime,
          endTime: latestSession.endTime,
        };
      }

      return null;
    } catch (error) {
      console.error("Health Connect sleep data error:", error);
      return null;
    }
  }

  // -----------------------------
  // Sleep Estimation (Inactivity-based)
  // -----------------------------
  calculateSleepDataFromEvents(events = []) {
    if (!events.length) {
      return {
        source: "inactivity",
        estimatedSleepMinutes: 0,
        confidence: 0,
      }
    }

    const { start, end } = this.getEffectiveSleepWindow()

    const today = new Date().toISOString().split("T")[0]
    const [sh, sm] = start.split(":").map(Number)
    const [eh, em] = end.split(":").map(Number)

    const windowStart = new Date(today)
    windowStart.setHours(sh, sm, 0, 0)

    const windowEnd = new Date(today)
    windowEnd.setHours(eh, em, 0, 0)
    if (windowEnd <= windowStart) windowEnd.setDate(windowEnd.getDate() + 1)

    const sorted = events
      .map(e => ({ ...e, time: new Date(e.timestamp) }))
      .filter(e => e.time >= windowStart && e.time <= windowEnd)
      .sort((a, b) => a.time - b.time)

    let sleepMinutes = 0
    let lastActive = windowStart

    for (const ev of sorted) {
      const gap = (ev.time - lastActive) / 60000

      // Only count sleep AFTER 30 min inactivity
      if (gap >= 30) {
        sleepMinutes += (gap - 30)
      }

      // Any interaction resets sleep
      lastActive = ev.time
    }

    const tailGap = (windowEnd - lastActive) / 60000
    if (tailGap >= 30) {
      sleepMinutes += (tailGap - 30)
    }

    sleepMinutes = Math.max(0, Math.min(sleepMinutes, (windowEnd - windowStart) / 60000))

    return {
      source: "inactivity",
      estimatedSleepMinutes: Math.round(sleepMinutes),
      confidence: Math.min(0.85, sleepMinutes / ((windowEnd - windowStart) / 60000)),
    }
  }



  // -----------------------------
  // Helper: Get Sleep Summary for Reports
  // -----------------------------
  async getSleepSummary(days = 7) {
    try {
      const sleepPrefs = await localStorageService.getSleepPreferences();
      let sleepData = [];

      if (sleepPrefs.mode === "fitness_band" && sleepPrefs.fitnessConnected) {
        sleepData = await localStorageService.getFitnessSleepData(days);
      } else {
        sleepData = await localStorageService.getScreenUsageSleepData(days);
      }

      return {
        mode: sleepPrefs.mode,
        data: sleepData,
        average: this.calculateAverageSleep(sleepData),
      };
    } catch (error) {
      console.error("Get sleep summary error:", error);
      return { mode: "screen_usage", data: [], average: 0 };
    }
  }

  calculateAverageSleep(sleepData) {
    if (!sleepData || sleepData.length === 0) return 0;
    
    const total = sleepData.reduce((sum, day) => {
      return sum + (day.sleepHours || day.estimatedSleepHours || 0);
    }, 0);
    
    return total / sleepData.length;
  }
}

export default new BehavioralTrackingService();