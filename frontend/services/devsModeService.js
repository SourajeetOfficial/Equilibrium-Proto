// File: frontend/services/devModeService.js
// ============================================================
// DEV MODE SERVICE
// - Passphrase protected (SHA-256 hashed, never stored in plain)
// - Memory-only session (no persistence across app restarts)
// - Auto-expires after SESSION_DURATION_MS
// - All dev capabilities funneled through this singleton
// ============================================================

import CryptoJS from "crypto-js";

// ⚠️ CHANGE THIS: sha256 of your chosen passphrase
// To generate: CryptoJS.SHA256("yourpassphrase").toString()
// Current passphrase hashed below → "dev2026"
// Run in console: require('crypto-js').SHA256("dev2026").toString()
const DEV_PASSPHRASE_HASH = "7691a81c8ebd9e37886813fae57afd0bea83e1d218fb89b1ea8cc90326772322";
// ↑ Replace this with: CryptoJS.SHA256("your_actual_secret").toString()

const SESSION_DURATION_MS = 30 * 60 * 1000; // 30 minutes auto-expire
const ACTIVATION_TAPS = 7; // Taps needed on the hidden zone

class DevModeService {
  constructor() {
    // Session state - memory only, never persisted
    this._isActive = false;
    this._sessionStartTime = null;
    this._sessionTimer = null;

    // Tap accumulator for activation gesture
    this._tapCount = 0;
    this._tapResetTimer = null;
    this._TAP_WINDOW_MS = 3000; // Taps must happen within 3s

    // Dev overrides - apply to runtime only
    this._overrides = {
      wellnessScore: null,     // null = use real score
      forceDate: null,         // null = use today
    };

    // Listeners for UI to react to mode changes
    this._listeners = new Set();
  }

  // ============================================================
  // ACTIVATION GESTURE — tap counter
  // Call this on each tap of your hidden zone (wellness score circle)
  // Returns: { shouldPrompt: boolean, tapsRemaining: number }
  // ============================================================
  registerTap() {
    this._tapCount += 1;

    // Reset tap counter after window expires
    clearTimeout(this._tapResetTimer);
    this._tapResetTimer = setTimeout(() => {
      this._tapCount = 0;
    }, this._TAP_WINDOW_MS);

    if (this._tapCount >= ACTIVATION_TAPS) {
      this._tapCount = 0;
      clearTimeout(this._tapResetTimer);
      return { shouldPrompt: true, tapsRemaining: 0 };
    }

    const remaining = ACTIVATION_TAPS - this._tapCount;
    // Only give feedback after 3rd tap to not reveal the mechanic too early
    return {
      shouldPrompt: false,
      tapsRemaining: this._tapCount >= 3 ? remaining : null,
    };
  }

  // ============================================================
  // AUTH — verify passphrase and start session
  // Returns: { success: boolean, error?: string }
  // ============================================================
  async authenticate(passphrase) {
    if (!passphrase || typeof passphrase !== "string") {
      return { success: false, error: "Invalid input" };
    }

    const inputHash = CryptoJS.SHA256(passphrase.trim()).toString();

    if (inputHash !== DEV_PASSPHRASE_HASH) {
      // Artificial delay to prevent brute force
      await new Promise((r) => setTimeout(r, 800));
      return { success: false, error: "Incorrect passphrase" };
    }

    this._startSession();
    return { success: true };
  }

  // ============================================================
  // SESSION MANAGEMENT
  // ============================================================
  _startSession() {
    this._isActive = true;
    this._sessionStartTime = Date.now();

    // Auto-expire
    clearTimeout(this._sessionTimer);
    this._sessionTimer = setTimeout(() => {
      this.deactivate("Session expired after 30 minutes");
    }, SESSION_DURATION_MS);

    this._notifyListeners();
    console.log("[DEV MODE] Session started");
  }

  deactivate(reason = "Manual deactivation") {
    this._isActive = false;
    this._sessionStartTime = null;
    this._overrides = { wellnessScore: null, forceDate: null };
    clearTimeout(this._sessionTimer);
    this._notifyListeners();
    console.log(`[DEV MODE] Deactivated: ${reason}`);
  }

  get isActive() {
    if (!this._isActive) return false;
    // Guard: double-check expiry
    if (Date.now() - this._sessionStartTime > SESSION_DURATION_MS) {
      this.deactivate("Session expired (lazy check)");
      return false;
    }
    return true;
  }

  get sessionTimeRemainingMs() {
    if (!this._isActive) return 0;
    return Math.max(0, SESSION_DURATION_MS - (Date.now() - this._sessionStartTime));
  }

  get sessionTimeRemainingLabel() {
    const ms = this.sessionTimeRemainingMs;
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  // ============================================================
  // LISTENERS — for UI updates
  // ============================================================
  subscribe(listener) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  _notifyListeners() {
    this._listeners.forEach((fn) => fn(this._isActive));
  }

  // ============================================================
  // DEV CAPABILITIES
  // All methods guard-check isActive first
  // ============================================================

  /**
   * Override the displayed wellness score (UI only, not persisted)
   * @param {number|null} score - 0-100, or null to reset
   */
  setWellnessScoreOverride(score) {
    this._requireActive();
    if (score !== null && (score < 0 || score > 100)) {
      throw new Error("Score must be 0-100");
    }
    this._overrides.wellnessScore = score;
  }

  get wellnessScoreOverride() {
    return this.isActive ? this._overrides.wellnessScore : null;
  }

  /**
   * Set a forced date for journal backdating
   * @param {string|null} dateStr - "YYYY-MM-DD" or null to reset
   */
  setForceDate(dateStr) {
    this._requireActive();
    if (dateStr !== null) {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) throw new Error("Invalid date format");
      if (d > new Date()) throw new Error("Cannot force a future date");
    }
    this._overrides.forceDate = dateStr;
  }

  get forcedDate() {
    return this.isActive ? this._overrides.forceDate : null;
  }

  /**
   * Get effective "today" — respects forceDate override
   */
  getEffectiveDate() {
    return this.forcedDate || new Date().toISOString().split("T")[0];
  }

  /**
   * Generate synthetic wellness data for a past date (for UI testing)
   * Returns a mock wellness record — not persisted to storage
   */
  generateMockWellnessRecord(dateStr, overrides = {}) {
    this._requireActive();
    const base = {
      date: dateStr,
      wellnessScore: Math.floor(50 + Math.random() * 50),
      sleepHours: 5 + Math.random() * 4,
      moodLabel: ["positive", "neutral", "negative"][Math.floor(Math.random() * 3)],
      sentimentScore: parseFloat((Math.random()).toFixed(3)),
      anomalyFlag: Math.random() > 0.8,
      screenTimeMinutes: Math.floor(60 + Math.random() * 300),
      _devGenerated: true,
    };
    return { ...base, ...overrides };
  }

  /**
   * Returns debug info about the AI scoring for an entry
   */
  getAIDebugInfo(entry) {
    this._requireActive();
    if (!entry) return null;
    return {
      sentiment_score: entry.sentiment_score ?? "N/A",
      mood_label: entry.mood_label ?? "N/A",
      anomaly_flag: entry.anomaly_flag ?? false,
      wellness_contribution: entry.wellness_contribution ?? "N/A",
      word_count: entry.content?.split(" ").length ?? 0,
      char_count: entry.content?.length ?? 0,
      processed_at: entry.processed_at ?? entry.timestamp ?? "unknown",
      model_version: entry.model_version ?? "v1",
      _note: "Dev mode — raw AI output",
    };
  }

  _requireActive() {
    if (!this.isActive) {
      throw new Error("Dev mode is not active");
    }
  }
}

// Singleton export
const devModeService = new DevModeService();
export default devModeService;