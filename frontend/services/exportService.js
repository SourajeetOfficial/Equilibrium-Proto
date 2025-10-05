import * as Print from "expo-print"
import * as MailComposer from "expo-mail-composer"
import * as Sharing from "expo-sharing"
import * as FileSystem from "expo-file-system"
import localStorageService from "./localStorageService"
import analyticsService from "./analyticsService"
import behavioralTrackingService from "./behavioralTrackingService"

class ExportService {
  constructor() {
    this.initialized = false
  }

  async initialize() {
    try {
      this.initialized = true
      console.log("ExportService initialized")
    } catch (error) {
      console.error("ExportService initialization error:", error)
      throw error
    }
  }

  // Export data as JSON
  async exportAsJSON() {
    try {
      const data = await this.gatherAllData()
      const jsonString = JSON.stringify(data, null, 2)

      const fileName = `equilibrium-data-${new Date().toISOString().split("T")[0]}.json`
      const fileUri = FileSystem.documentDirectory + fileName

      await FileSystem.writeAsStringAsync(fileUri, jsonString)

      return {
        success: true,
        fileUri,
        fileName,
        format: "JSON",
      }
    } catch (error) {
      console.error("JSON export error:", error)
      return { success: false, error: error.message }
    }
  }

  // Export data as CSV
  async exportAsCSV() {
    try {
      const data = await this.gatherAllData()
      const csvContent = this.convertToCSV(data)

      const fileName = `equilibrium-data-${new Date().toISOString().split("T")[0]}.csv`
      const fileUri = FileSystem.documentDirectory + fileName

      await FileSystem.writeAsStringAsync(fileUri, csvContent)

      return {
        success: true,
        fileUri,
        fileName,
        format: "CSV",
      }
    } catch (error) {
      console.error("CSV export error:", error)
      return { success: false, error: error.message }
    }
  }

  // Export as PDF report
  async exportAsPDF() {
    try {
      const data = await this.gatherAllData()
      const analytics = await analyticsService.generateWellnessAnalytics(30)

      const htmlContent = this.generatePDFHTML(data, analytics)

      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      })

      const fileName = `equilibrium-report-${new Date().toISOString().split("T")[0]}.pdf`
      const newUri = FileSystem.documentDirectory + fileName

      await FileSystem.moveAsync({
        from: uri,
        to: newUri,
      })

      return {
        success: true,
        fileUri: newUri,
        fileName,
        format: "PDF",
      }
    } catch (error) {
      console.error("PDF export error:", error)
      return { success: false, error: error.message }
    }
  }

  // Share exported file
  async shareFile(fileUri, format) {
    try {
      const isAvailable = await Sharing.isAvailableAsync()

      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: this.getMimeType(format),
          dialogTitle: `Share Equilibrium ${format} Export`,
        })
        return { success: true }
      } else {
        return { success: false, error: "Sharing not available on this device" }
      }
    } catch (error) {
      console.error("Share file error:", error)
      return { success: false, error: error.message }
    }
  }

  // Email exported file
  async emailFile(fileUri, format, recipientEmail = "") {
    try {
      const isAvailable = await MailComposer.isAvailableAsync()

      if (isAvailable) {
        await MailComposer.composeAsync({
          recipients: recipientEmail ? [recipientEmail] : [],
          subject: `Equilibrium Wellness Data Export - ${format}`,
          body: `Please find attached your wellness data export from Equilibrium.\n\nThis file contains your personal wellness tracking data and should be kept confidential.\n\nGenerated on: ${new Date().toLocaleDateString()}`,
          attachments: [fileUri],
        })
        return { success: true }
      } else {
        return { success: false, error: "Email not available on this device" }
      }
    } catch (error) {
      console.error("Email file error:", error)
      return { success: false, error: error.message }
    }
  }

  // Gather all user data
  async gatherAllData() {
    try {
      const journalEntries = await localStorageService.getJournalEntries()
      const wellnessData = await localStorageService.getWellnessData(90) // Last 90 days
      const userPreferences = await localStorageService.getUserPreferences()
      const consentData = await localStorageService.getConsentData()

      let usageData = []
      if (behavioralTrackingService.hasConsent()) {
        usageData = await behavioralTrackingService.getWeeklyUsageStats()
      }

      return {
        exportInfo: {
          exportDate: new Date().toISOString(),
          appVersion: "1.0.0",
          dataTypes: ["journal", "wellness", "preferences", "consent", "usage"],
        },
        journalEntries: journalEntries.map((entry) => ({
          id: entry.id,
          date: entry.timestamp,
          mood: entry.mood,
          content: entry.text,
          sentiment: entry.sentiment,
        })),
        wellnessData: wellnessData.map((day) => ({
          date: day.date,
          wellnessScore: day.wellnessScore,
          moodScore: day.moodScore,
          sleepHours: day.sleepHours,
          activityMinutes: day.activityMinutes,
          stressLevel: day.stressLevel,
        })),
        usageData: usageData.map((day) => ({
          date: day.date,
          screenTimeHours: day.screenTimeHours,
          pickupCount: day.pickupCount,
          totalSessions: day.totalSessions,
          avgSessionDuration: day.avgSessionDuration,
        })),
        preferences: userPreferences,
        consent: consentData,
      }
    } catch (error) {
      console.error("Error gathering data:", error)
      throw error
    }
  }

  // Convert data to CSV format
  convertToCSV(data) {
    let csv = ""

    // Wellness data CSV
    if (data.wellnessData && data.wellnessData.length > 0) {
      csv += "WELLNESS DATA\n"
      csv += "Date,Wellness Score,Mood Score,Sleep Hours,Activity Minutes,Stress Level\n"

      data.wellnessData.forEach((day) => {
        csv += `${day.date},${day.wellnessScore || ""},${day.moodScore || ""},${day.sleepHours || ""},${day.activityMinutes || ""},${day.stressLevel || ""}\n`
      })
      csv += "\n"
    }

    // Usage data CSV
    if (data.usageData && data.usageData.length > 0) {
      csv += "USAGE DATA\n"
      csv += "Date,Screen Time Hours,Pickup Count,Total Sessions,Avg Session Duration\n"

      data.usageData.forEach((day) => {
        csv += `${day.date},${day.screenTimeHours || ""},${day.pickupCount || ""},${day.totalSessions || ""},${day.avgSessionDuration || ""}\n`
      })
      csv += "\n"
    }

    // Journal entries CSV
    if (data.journalEntries && data.journalEntries.length > 0) {
      csv += "JOURNAL ENTRIES\n"
      csv += "Date,Mood,Content,Sentiment\n"

      data.journalEntries.forEach((entry) => {
        const content = entry.content.replace(/"/g, '""').replace(/\n/g, " ")
        csv += `${entry.date},${entry.mood || ""},"${content}",${entry.sentiment || ""}\n`
      })
    }

    return csv
  }

  // Generate HTML for PDF report
  generatePDFHTML(data, analytics) {
    const today = new Date().toLocaleDateString()

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Equilibrium Wellness Report</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
            .header { text-align: center; border-bottom: 2px solid #059669; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #059669; }
            .subtitle { color: #6b7280; margin-top: 5px; }
            .section { margin-bottom: 30px; }
            .section-title { font-size: 18px; font-weight: bold; color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 15px; }
            .stats-grid { display: flex; justify-content: space-between; margin-bottom: 20px; }
            .stat-card { text-align: center; padding: 15px; background: #f9fafb; border-radius: 8px; min-width: 120px; }
            .stat-value { font-size: 24px; font-weight: bold; color: #059669; }
            .stat-label { font-size: 12px; color: #6b7280; margin-top: 5px; }
            .insight { background: #eff6ff; padding: 15px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid #3b82f6; }
            .insight-title { font-weight: bold; color: #1e40af; }
            .insight-message { margin-top: 5px; color: #1e40af; }
            .recommendation { background: #f0fdf4; padding: 10px; border-radius: 6px; margin-bottom: 8px; border-left: 3px solid #10b981; }
            .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; }
            .data-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            .data-table th, .data-table td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; }
            .data-table th { background: #f9fafb; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="logo">Equilibrium</div>
            <div class="subtitle">Personal Wellness Report</div>
            <div class="subtitle">Generated on ${today}</div>
        </div>

        <div class="section">
            <div class="section-title">Wellness Overview</div>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${analytics.overview.avgWellnessScore}</div>
                    <div class="stat-label">Average Wellness Score</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${analytics.overview.avgMoodScore}</div>
                    <div class="stat-label">Average Mood Score</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${analytics.overview.avgSleepHours}h</div>
                    <div class="stat-label">Average Sleep</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${analytics.overview.totalDaysTracked}</div>
                    <div class="stat-label">Days Tracked</div>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Key Insights</div>
            ${analytics.insights
              .map(
                (insight) => `
                <div class="insight">
                    <div class="insight-title">${insight.title}</div>
                    <div class="insight-message">${insight.message}</div>
                </div>
            `,
              )
              .join("")}
        </div>

        <div class="section">
            <div class="section-title">Recommendations</div>
            ${analytics.recommendations
              .map(
                (rec) => `
                <div class="recommendation">• ${rec}</div>
            `,
              )
              .join("")}
        </div>

        <div class="section">
            <div class="section-title">Trends</div>
            <p><strong>Wellness Trend:</strong> ${analytics.trends.wellnessTrend}</p>
            <p><strong>Mood Trend:</strong> ${analytics.trends.moodTrend}</p>
            <p><strong>Sleep Trend:</strong> ${analytics.trends.sleepTrend}</p>
        </div>

        ${
          data.wellnessData.length > 0
            ? `
        <div class="section">
            <div class="section-title">Recent Wellness Data</div>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Wellness Score</th>
                        <th>Mood</th>
                        <th>Sleep Hours</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.wellnessData
                      .slice(0, 10)
                      .map(
                        (day) => `
                        <tr>
                            <td>${new Date(day.date).toLocaleDateString()}</td>
                            <td>${day.wellnessScore || "N/A"}</td>
                            <td>${day.moodScore || "N/A"}</td>
                            <td>${day.sleepHours || "N/A"}</td>
                        </tr>
                    `,
                      )
                      .join("")}
                </tbody>
            </table>
        </div>
        `
            : ""
        }

        <div class="footer">
            <p>This report contains personal wellness data and should be kept confidential.</p>
            <p>Generated by Equilibrium - Your Personal Mental Health Companion</p>
        </div>
    </body>
    </html>
    `
  }

  // Get MIME type for file format
  getMimeType(format) {
    switch (format.toUpperCase()) {
      case "JSON":
        return "application/json"
      case "CSV":
        return "text/csv"
      case "PDF":
        return "application/pdf"
      default:
        return "application/octet-stream"
    }
  }
}

export default new ExportService()
