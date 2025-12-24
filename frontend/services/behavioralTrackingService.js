// BehavioralTrackingService.js

import { AppState, Alert, NativeModules, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import authService from "./authService";
import localStorageService from "./localStorageService";

const { UsageStatsModule, HealthConnectModule } = NativeModules;

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
  // Initialization
  // -----------------------------
  async initializeTracking() {
    await this.loadUserSleepWindow();

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
      const sleepData = await this.getSleepData(screenTimeMinutes);

      // Save screen usage sleep estimation
      if (sleepData.source === "inactivity") {
        const today = new Date().toISOString().split("T")[0];
        await localStorageService.saveScreenUsageSleepData(today, {
          estimatedSleepMinutes: sleepData.estimatedSleepMinutes,
          estimatedSleepHours: sleepData.estimatedSleepMinutes / 60,
          confidence: sleepData.confidence,
          screenTimeMinutes,
          sleepWindow: this.getEffectiveSleepWindow(),
        });
      }

      return {
        screenTimeMinutes,
        pickupCount: usage.pickupCount || 0,
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
  async getSleepData(totalScreenTimeMinutes) {
    // Check user preference first
    const sleepPrefs = await localStorageService.getSleepPreferences();

    // 1️⃣ Priority: Fitness Band (Health Connect) if user chose this mode
    if (sleepPrefs.mode === "fitness_band" && sleepPrefs.fitnessConnected) {
      const healthConnectData = await this.getHealthConnectSleepData();
      if (healthConnectData) {
        // Save fitness sleep data
        const today = new Date().toISOString().split("T")[0];
        await localStorageService.saveFitnessSleepData(today, {
          sleepMinutes: healthConnectData.durationMinutes,
          sleepHours: healthConnectData.durationMinutes / 60,
          confidence: healthConnectData.confidence,
          stages: healthConnectData.stages,
        });
        return healthConnectData;
      }
    }

    // 2️⃣ Fallback: Screen Usage Estimation
    return this.calculateSleepData(totalScreenTimeMinutes);
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
  calculateSleepData(totalScreenTimeMinutes) {
    const today = new Date().toISOString().split("T")[0];
    const { start, end } = this.getEffectiveSleepWindow();

    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);

    const sleepStart = new Date(today);
    sleepStart.setHours(sh, sm, 0, 0);

    const sleepEnd = new Date(today);
    sleepEnd.setHours(eh, em, 0, 0);
    if (sleepEnd <= sleepStart) sleepEnd.setDate(sleepEnd.getDate() + 1);

    const windowMinutes = (sleepEnd - sleepStart) / 60000;

    return {
      source: "inactivity",
      estimatedSleepMinutes: Math.max(
        0,
        Math.round(windowMinutes - totalScreenTimeMinutes)
      ),
      confidence: 0.6,
    };
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