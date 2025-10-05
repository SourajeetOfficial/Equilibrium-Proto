// BehavioralTrackingService.js

import { AppState, Alert, NativeModules, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import authService from "./authService";

const { UsageStatsModule } = NativeModules;

class BehavioralTrackingService {
  constructor() {
    this.isTracking = false;
    this.consentGiven = false;
    this.canTrackDeviceUsage = false;
    this.appStateSubscription = null;
    this.screenTimeTimer = null;
    this.lastInteractionTime = Date.now();

    this.defaultSleepStart = "22:00";
    this.defaultSleepEnd = "08:00";
    this.userSleepWindow = null;
  }

  // -----------------------------
  // Sleep Window
  // -----------------------------
  async setUserSleepWindow(start, end) {
    try {
      this.userSleepWindow = { start, end };
      await AsyncStorage.setItem("userSleepWindow", JSON.stringify(this.userSleepWindow));
    } catch (e) {
      console.error("Error saving sleep window:", e);
    }
  }

  async loadUserSleepWindow() {
    try {
      const saved = await AsyncStorage.getItem("userSleepWindow");
      this.userSleepWindow = saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error("Error loading sleep window:", e);
      this.userSleepWindow = null;
    }
  }

  getEffectiveSleepWindow() {
    return this.userSleepWindow || { start: this.defaultSleepStart, end: this.defaultSleepEnd };
  }

  // -----------------------------
  // Permissions
  // -----------------------------
  async requestUsageStatsPermission() {
    if (Platform.OS === "android" && UsageStatsModule) {
      try {
        const granted = await UsageStatsModule.requestPermission();
        this.canTrackDeviceUsage = granted;
        return granted;
      } catch (e) {
        console.error("Usage stats permission error:", e);
        this.canTrackDeviceUsage = false;
        return false;
      }
    }
    this.canTrackDeviceUsage = false;
    return false;
  }

  async initializeTracking() {
    await this.loadUserSleepWindow();
    const user = authService.getCurrentUser();

    if (user?.consentFlags?.usageTracking) {
      this.consentGiven = true;
      const granted = await this.requestUsageStatsPermission();
      if (granted) this.startTracking();
      else Alert.alert(
        "Permission Required",
        "Enable Usage Data Access for Equilibrium in your phone's settings."
      );
    } else {
      this.consentGiven = false;
    }
  }

  // -----------------------------
  // Tracking
  // -----------------------------
  startTracking() {
    if (this.isTracking || !this.consentGiven) return;
    this.isTracking = true;
    this.appStateSubscription = AppState.addEventListener(
      "change",
      (nextAppState) => {
        if (nextAppState === "active") this.lastInteractionTime = Date.now();
      }
    );
    this.screenTimeTimer = setInterval(() => {
      this.lastInteractionTime = Date.now();
    }, 60 * 1000);
  }

  stopTracking() {
    this.isTracking = false;
    this.appStateSubscription?.remove();
    if (this.screenTimeTimer) clearInterval(this.screenTimeTimer);
  }

  // -----------------------------
  // Usage Stats
  // -----------------------------
  async getDailyUsageStats() {
    if (!this.consentGiven) return { screenTimeMinutes: 0, pickupCount: 0, appUsage: [], sleepData: {} };

    if (this.canTrackDeviceUsage && UsageStatsModule) {
      try {
        const usage = await UsageStatsModule.getUsageStats();

        // Sort apps descending
        const appsSorted = usage.apps
          ? [...usage.apps].sort((a, b) => b.durationMinutes - a.durationMinutes)
          : [];

        const sleepData = this.calculateSleepData({
          totalScreenTime: usage.totalScreenTime, // seconds
        });

        return {
          screenTimeMinutes: Math.floor(usage.totalScreenTime / 60),
          pickupCount: usage.pickupCount,
          appUsage: appsSorted.map(app => ({
            appName: app.appName,
            package: app.package,
            durationMinutes: app.durationMinutes,
          })),
          sleepData,
        };
      } catch (e) {
        console.error("Error fetching usage stats:", e);
        return { screenTimeMinutes: 0, pickupCount: 0, appUsage: [], sleepData: {} };
      }
    } else {
      // fallback for Expo Go
      const today = new Date().toISOString().split("T")[0];
      const data = await AsyncStorage.getItem("dailyUsageData");
      const dayData = data ? JSON.parse(data)[today] || {} : {};
      const sleepData = this.calculateSleepData(dayData);

      return {
        screenTimeMinutes: Math.floor((dayData.totalScreenTime || 0) / 60),
        pickupCount: dayData.pickupCount || 0,
        appUsage: dayData.appUsage || [],
        sleepData,
      };
    }
  }

  // -----------------------------
  // Sleep Calculation
  // -----------------------------
  calculateSleepData(usageData) {
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const { start, end } = this.getEffectiveSleepWindow();

    const [startHour, startMin] = start.split(":").map(Number);
    const [endHour, endMin] = end.split(":").map(Number);

    const sleepStart = new Date(today); sleepStart.setHours(startHour, startMin, 0, 0);
    const sleepEnd = new Date(today); sleepEnd.setHours(endHour, endMin, 0, 0);

    if (sleepEnd < sleepStart) sleepEnd.setDate(sleepEnd.getDate() + 1);

    const inactiveMinutes = ((sleepEnd - sleepStart) / 1000 / 60) - (usageData.totalScreenTime / 60 || 0);

    return { sleepWindow: { start, end }, estimatedSleepMinutes: inactiveMinutes > 0 ? inactiveMinutes : 0 };
  }
}

export default new BehavioralTrackingService();
