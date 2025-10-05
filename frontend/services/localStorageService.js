// File: services/LocalStorageService.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import CryptoJS from "crypto-js";

const STORAGE_KEYS = {
  ENCRYPTION_KEY: "device_encryption_key",
  JOURNAL_ENTRIES: "journal_entries",
  WELLNESS_DATA: "wellness_data",
  APP_USAGE: "app_usage",
  USER_PREFERENCES: "user_preferences",
  CONSENT_DATA: "consent_data",
};

class LocalStorageService {
  constructor() {
    this.initialized = false;
    this.encryptionKey = null;
  }

  async initialize() {
    try {
      this.encryptionKey = await this.getOrCreateDeviceKey();
      this.initialized = true;
      console.log("LocalStorageService initialized with secure key");
    } catch (error) {
      console.error("LocalStorageService initialization error:", error);
      throw error;
    }
  }

  // 🔑 Generate or fetch stored per-device key (stored in SecureStore)
  async getOrCreateDeviceKey() {
    try {
      let key = await SecureStore.getItemAsync(STORAGE_KEYS.ENCRYPTION_KEY);
      if (key) return key;

      // Generate pseudo-random key (32 chars)
      const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      let randomKey = "";
      for (let i = 0; i < 32; i++) {
        randomKey += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      // Hash it into 256-bit key
      const hashedKey = CryptoJS.SHA256(randomKey).toString();

      // Save securely in SecureStore
      await SecureStore.setItemAsync(STORAGE_KEYS.ENCRYPTION_KEY, hashedKey, {
        keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
      });

      return hashedKey;
    } catch (error) {
      console.error("Encryption key error:", error);
      throw error;
    }
  }

// 🔐 Encryption helpers
encrypt(data) {
  try {
    const key = CryptoJS.enc.Hex.parse(this.encryptionKey)  // use WordArray
    const iv = CryptoJS.enc.Hex.parse(this.encryptionKey.substring(0, 32)) // derive IV
    return CryptoJS.AES.encrypt(
      JSON.stringify(data),
      key,
      { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
    ).toString()
  } catch (error) {
    console.error("Encryption error:", error)
    return null
  }
}

decrypt(encryptedData) {
  try {
    const key = CryptoJS.enc.Hex.parse(this.encryptionKey)
    const iv = CryptoJS.enc.Hex.parse(this.encryptionKey.substring(0, 32))
    const bytes = CryptoJS.AES.decrypt(encryptedData, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    })
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8))
  } catch (error) {
    console.error("Decryption error:", error)
    return null
  }
}


  // 📦 Generic storage methods
  async setItem(key, value, encrypt = true) {
    try {
      if (value === null || value === undefined) {
        await AsyncStorage.removeItem(key);
        return true;
      }

      const dataToStore = encrypt
        ? this.encrypt(value)
        : JSON.stringify(value);
      await AsyncStorage.setItem(key, dataToStore);
      return true;
    } catch (error) {
      console.error("Storage setItem error:", error);
      return false;
    }
  }

  async getItem(key, decrypt = true) {
    try {
      const data = await AsyncStorage.getItem(key);
      if (!data) return null;
      return decrypt ? this.decrypt(data) : JSON.parse(data);
    } catch (error) {
      console.error("Storage getItem error:", error);
      return null;
    }
  }

  async removeItem(key) {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error("Storage removeItem error:", error);
      return false;
    }
  }

  // ✍️ Journal entries
  async saveJournalEntry(entry) {
    try {
      const entries = (await this.getJournalEntries()) || [];
      const newEntry = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        ...entry,
      };
      entries.unshift(newEntry);

      const limitedEntries = entries.slice(0, 100);
      await this.setItem(STORAGE_KEYS.JOURNAL_ENTRIES, limitedEntries);
      return newEntry;
    } catch (error) {
      console.error("Save journal entry error:", error);
      return null;
    }
  }

  async getJournalEntries(limit = null) {
    try {
      const entries = (await this.getItem(STORAGE_KEYS.JOURNAL_ENTRIES)) || [];
      return limit ? entries.slice(0, limit) : entries;
    } catch (error) {
      console.error("Get journal entries error:", error);
      return [];
    }
  }

  async deleteJournalEntry(entryId) {
    try {
      const entries = (await this.getJournalEntries()) || [];
      const filteredEntries = entries.filter((entry) => entry.id !== entryId);
      await this.setItem(STORAGE_KEYS.JOURNAL_ENTRIES, filteredEntries);
      return true;
    } catch (error) {
      console.error("Delete journal entry error:", error);
      return false;
    }
  }

  // ❤️ Wellness data
  async saveWellnessData(date, data) {
    try {
      const wellnessData = (await this.getItem(STORAGE_KEYS.WELLNESS_DATA)) || {};
      wellnessData[date] = {
        ...data,
        timestamp: new Date().toISOString(),
      };
      await this.setItem(STORAGE_KEYS.WELLNESS_DATA, wellnessData);
      return true;
    } catch (error) {
      console.error("Save wellness data error:", error);
      return false;
    }
  }

  async getWellnessData(days = 30) {
    try {
      const wellnessData = (await this.getItem(STORAGE_KEYS.WELLNESS_DATA)) || {};
      const sortedDates = Object.keys(wellnessData).sort().reverse();
      return sortedDates.slice(0, days).map((date) => ({
        date,
        ...wellnessData[date],
      }));
    } catch (error) {
      console.error("Get wellness data error:", error);
      return [];
    }
  }

  // 📊 App usage tracking
  async saveAppUsage(date, usageData) {
    try {
      const appUsage = (await this.getItem(STORAGE_KEYS.APP_USAGE)) || {};
      appUsage[date] = {
        ...usageData,
        timestamp: new Date().toISOString(),
      };
      await this.setItem(STORAGE_KEYS.APP_USAGE, appUsage);
      return true;
    } catch (error) {
      console.error("Save app usage error:", error);
      return false;
    }
  }

  async getAppUsage(days = 7) {
    try {
      const appUsage = (await this.getItem(STORAGE_KEYS.APP_USAGE)) || {};
      const sortedDates = Object.keys(appUsage).sort().reverse();
      return sortedDates.slice(0, days).map((date) => ({
        date,
        ...appUsage[date],
      }));
    } catch (error) {
      console.error("Get app usage error:", error);
      return [];
    }
  }

  // ⚙️ User preferences
  async saveUserPreferences(preferences) {
    try {
      await this.setItem(STORAGE_KEYS.USER_PREFERENCES, preferences);
      return true;
    } catch (error) {
      console.error("Save user preferences error:", error);
      return false;
    }
  }

  async getUserPreferences() {
    try {
      return (await this.getItem(STORAGE_KEYS.USER_PREFERENCES)) || {};
    } catch (error) {
      console.error("Get user preferences error:", error);
      return {};
    }
  }

  // ✅ Consent data
  async saveConsentData(consentData) {
    try {
      await this.setItem(STORAGE_KEYS.CONSENT_DATA, consentData);
      return true;
    } catch (error) {
      console.error("Save consent data error:", error);
      return false;
    }
  }

  async getConsentData() {
    try {
      return (await this.getItem(STORAGE_KEYS.CONSENT_DATA)) || {};
    } catch (error) {
      console.error("Get consent data error:", error);
      return {};
    }
  }

  // 🧹 Clear all data
  async clearAllData() {
    try {
      await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
      return true;
    } catch (error) {
      console.error("Clear all data error:", error);
      return false;
    }
  }

  // 📤 Export all data (without key)
  async exportAllData() {
    try {
      const data = {};
      for (const [key, storageKey] of Object.entries(STORAGE_KEYS)) {
        if (key === "ENCRYPTION_KEY") continue; // don’t export secret key
        data[key] = await this.getItem(storageKey);
      }
      return data;
    } catch (error) {
      console.error("Export all data error:", error);
      return null;
    }
  }
}

export default new LocalStorageService();
