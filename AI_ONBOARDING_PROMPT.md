# AI Onboarding Prompt for Equilibrium Project

**Copy this entire document and paste it into your AI assistant to:**
- **Understand the complete project structure and architecture**
- **Make code changes to specific files based on your requirements**
- **Add new features following existing patterns and conventions**
- **Debug issues across frontend and backend**

> **Usage**: Paste this prompt, then request changes like: "Add a new field to User model" or "Create an endpoint for X" or "Update the Dashboard screen to show Y"

---

## Project Overview

Equilibrium is a **privacy-first mental health and wellness tracking application** built as a full-stack monorepo:
- **Backend**: Node.js/Express REST API with MongoDB (in `backend/` folder)
- **Frontend**: React Native mobile app using Expo (in `frontend/` folder)
- **Core Philosophy**: Sensitive data encrypted locally, on-device AI processing, GDPR-compliant

## Architecture Summary

```
User Device (React Native/Expo)
    ↓
    ├─ Local Encrypted Storage (AES via SecureStore)
    ├─ On-Device AI (sentiment analysis, wellness scoring)
    └─ HTTP API Calls (JWT authenticated)
         ↓
    Backend (Express + MongoDB)
         ├─ Auth & User Management
         ├─ Aggregate Data Storage (pseudonymized)
         └─ Community/Forum/Help Directory
```

---

## Directory Structure & Key Files

### Backend (`backend/`)

#### **Entry Point**
- **`server.js`**: Main server file that:
  - Connects to MongoDB via `connectDB()`
  - Configures CORS for Expo dev servers
  - Mounts versioned API routes under `/api/v1/`
  - Runs daily cron job (2 AM IST) to cleanup unverified users

#### **Configuration**
- **`config/db.js`**: MongoDB connection using Mongoose

#### **Models** (`models/`)
- **`User.js`**: User schema with:
  - `pseudonymId`: Anonymous identifier for privacy
  - `email`, `username`, `password` (bcrypt hashed)
  - `isVerified`: Email verification flag
  - `verificationToken`: For email verification
  - `pushToken`: Expo push notification token
  - `consentFlags`: {usageTracking, cloudSync, emergencyContacts, closeContacts}
  - `dataEncryptionKey`: Per-user AES key for server-side encryption
  - `emergencyContacts`: Encrypted array of emergency contacts
  - Methods: `matchPassword()`, `encryptContact()`, `decryptContact()`

- **`Aggregate.js`**: Daily wellness summaries per user:
  - `user`: ObjectId reference to User
  - `date`: Date of the aggregate
  - `avg_sleep_hours`: Average sleep (number)
  - `night_screen_minutes`: Screen time during sleep window
  - `sentiment_label`: 'positive' | 'neutral' | 'negative' | 'not_recorded'
  - Unique index on `(user, date)` to prevent duplicates

- **`Alert.js`**: Wellness alerts:
  - `user`, `pseudonymId`
  - `type`: 'wellness_drop' | 'crisis_level'
  - `message`, `primaryCause`, `read` status

- **`ForumPost.js`, `ForumComment.js`**: Community forum content
- **`ProfessionalHelp.js`**: Mental health professional directory

#### **Controllers** (`controllers/`)
- **`authController.js`**: Handles all auth flows:
  - `register()`: Creates user, sends verification email via `sendEmail()`
  - `login()`: Checks `isVerified` flag before issuing JWT (30-day expiry)
  - `verifyEmail()`: Confirms email via token
  - `getProfile()`, `updateProfile()`: User profile management
  - `updateConsent()`: Updates consent flags
  - `savePushToken()`: Stores Expo push token
  - `exportUserData()`: GDPR data export
  - `clearUserData()`: Deletes aggregates/alerts (keeps account)
  - `deleteUserAccount()`: Full account deletion (requires password)
  - `forgotPassword()`, `resetPassword()`, `changePassword()`

- **`aggregateController.js`**:
  - `logAggregate()`: Upserts daily aggregate (rejects if `usageTracking` consent is false)
  - `getAggregates()`: Returns last 30 days of aggregates

- **`reportController.js`**:
  - `getReport()`: Generates weekly/monthly/yearly summaries from aggregates

- **`alertController.js`**:
  - `triggerAlert()`: Sends Expo push notification to user's device

- **`forumController.js`**, **`helpDirectoryController.js`**, **`contactController.js`**: Forum, help directory, and emergency contact management

#### **Middleware** (`middleware/`)
- **`authMiddleware.js`**: 
  - `protect()`: JWT verification middleware that attaches `req.user` to protected routes

#### **Routes** (`routes/`)
- **`auth.js`**: Auth endpoints (`/api/v1/auth/*`)
  - POST `/register`, `/login`, `/logout`
  - GET `/profile`, `/export`, `/verifyemail/:token`
  - PUT `/profile`
  - POST `/consent`, `/push-token`, `/clear-data`, `/delete`, `/changepassword`, `/forgotpassword`, `/resetpassword/:resettoken`

- **`aggregate.js`**: Aggregate endpoints (`/api/v1/aggregates`)
  - POST `/` - Log aggregate
  - GET `/` - Get aggregates

- **`reports.js`**: Report endpoints (`/api/v1/reports`)
  - GET `/?period=weekly|monthly|yearly`

- **`alerts.js`**: Alert endpoints (`/api/v1/alerts`)
  - POST `/trigger` - Send push notification

- **`forum.js`**, **`helpDirectory.js`**, **`contacts.js`**: Additional feature routes

#### **Services** (`services/`)
- **`maintenanceService.js`**:
  - `cleanupUnverifiedUsers()`: Deletes users unverified for >24 hours

#### **Utils** (`utils/`)
- **`sendEmail.js`**: Email sending utility for verification/password reset

---

### Frontend (`frontend/`)

#### **Entry Point**
- **`App.js`**: Root component that:
  - Initializes `localStorageService`, `authService`
  - Conditionally renders `AuthNavigator` vs `MainNavigator` based on auth state
  - Sets up `behavioralTrackingService` and `notificationService` when authenticated
  - Listens to AppState changes

- **`index.js`**: Expo entry point

#### **Configuration**
- **`config/api.js`**: Axios instance with:
  - `baseURL`: Uses `LOCAL_IP` for Android dev, `localhost` for iOS
  - Request interceptor: Injects JWT token from AsyncStorage
  - Response interceptor: Logs errors, handles 401/403/500 codes

#### **Screens** (`screens/`)

##### Auth Screens (`screens/auth/`)
- **`WelcomeScreen.js`**: App introduction
- **`LoginScreen.js`**: Login form
- **`RegisterScreen.js`**: Registration form
- **`ForgotPasswordScreen.js`**: Password reset request

##### Main Screens
- **`Dashboard.js`**: Home screen with wellness overview, mood tracking
- **`Journal.js`**: Private encrypted journal entries with sentiment analysis
- **`Tracker.js`**: Behavioral tracking screen (sleep, screen time, app usage)
- **`Community.js`**: Forum/community support
- **`Emergency.js`**: Crisis resources and emergency contacts
- **`Reports.js`**: Wellness reports and analytics
- **`AdvancedReports.js`**: Detailed report visualization
- **`ProfileScreen.js`**: User profile and settings
- **`SettingsScreen.js`**: App settings
- **`PrivacySettingsScreen.js`**: Consent management
- **`HelpDirectoryScreen.js`**: Professional help directory
- **`NotificationSettings.js`**: Push notification preferences
- **`ChangePasswordScreen.js`**: Password change form

#### **Services** (`services/`)

- **`authService.js`**: Authentication manager (singleton):
  - `initializeAuth()`: Loads token/user from AsyncStorage, verifies with backend
  - `register()`, `login()`, `logout()`
  - `updateConsent()`, `updateProfile()`, `savePushToken()`
  - `exportUserData()`, `clearUserData()`, `deleteAccount()`
  - `forgotPassword()`, `changePassword()`
  - Auth state listeners: `addAuthStateListener()`, `notifyAuthStateChange()`

- **`localStorageService.js`**: Encrypted local storage (singleton):
  - `initialize()`: Creates/loads AES encryption key from SecureStore
  - `encrypt()`, `decrypt()`: AES-256-CBC encryption with device key
  - `setItem()`, `getItem()`, `removeItem()`: Generic encrypted storage
  - `saveJournalEntry()`, `getJournalEntries()`, `deleteJournalEntry()`
  - `saveWellnessData()`, `getWellnessData()`
  - `saveSleepWindow()`, `getSleepWindow()`
  - `saveAppUsage()`, `getAppUsage()`
  - `saveUserPreferences()`, `getUserPreferences()`
  - `saveConsentData()`, `getConsentData()`
  - `clearAllData()`

- **`onDeviceAIService.js`**: Local AI processing (singleton):
  - `analyzeSentiment(text)`: Keyword-based sentiment analysis (positive/neutral/negative)
  - `calculateWellnessScore(metrics)`: Computes 0-100 score from sleep, mood, screen time, activity
  - `generateWellnessInsights(wellnessData)`: Pattern-based insights and recommendations
  - `detectAnomalies(wellnessData)`: Detects wellness drops and concerning patterns
  - `generateRecommendations(userProfile, wellnessData)`: Personalized suggestions

- **`behavioralTrackingService.js`**: Native usage tracking (singleton):
  - `initializeTracking()`: Checks consent, requests Android Usage Access permission
  - `requestUsageStatsPermission()`: Opens Android settings for permission
  - `getDailyUsageStats()`: Fetches data from `UsageStatsModule` (native module):
    - `screenTimeMinutes`, `pickupCount`, `appUsage[]`
  - `getSleepData()`: Tries HealthConnect first, falls back to inactivity estimation
  - `calculateSleepData()`: Estimates sleep from user-defined sleep window minus screen time
  - `setUserSleepWindow()`, `loadUserSleepWindow()`, `getEffectiveSleepWindow()`

- **`analyticsService.js`**: Aggregates data sync to backend
- **`consentService.js`**: Consent management helpers
- **`contactsService.js`**: Emergency contact management
- **`dataPortabilityService.js`**: Import/export utilities
- **`dataPrivacyService.js`**: Privacy-related operations
- **`exportService.js`**: Data export formatting
- **`forumService.js`**: Forum API calls
- **`helpDirectoryService.js`**: Professional help directory API
- **`journalService.js`**: Journal management
- **`moodService.js`**: Mood tracking utilities
- **`notificationService.js`**: Push notification setup (Expo)
- **`reportsService.js`**: Report fetching and processing
- **`wellnessService.js`**: Wellness score calculations

#### **Components** (`components/`)
- **`SafeAreaWrapper.js`**: Safe area handling for notches/gesture bars
- **`ResponsiveCard.js`**: Adaptive card component
- **`ResponsiveGrid.js`**: Responsive grid layout

---

## Key Data Flows

### 1. Registration & Login Flow
```
User enters email/username/password
    → POST /api/v1/auth/register
    → User created (isVerified=false)
    → Verification email sent
    → User clicks link → GET /api/v1/auth/verifyemail/:token
    → isVerified=true
    → User can now login
    → POST /api/v1/auth/login (checks isVerified)
    → JWT token returned (30-day expiry)
    → Token stored in AsyncStorage
    → GET /api/v1/auth/profile fetches user data
```

### 2. Daily Wellness Tracking Flow
```
User opens Tracker screen
    → behavioralTrackingService.getDailyUsageStats()
    → Fetches from native UsageStatsModule (if consent given)
    → Returns: screenTimeMinutes, pickupCount, appUsage[], sleepData
    → User logs mood in Dashboard
    → onDeviceAIService.calculateWellnessScore() computes score
    → analyticsService syncs to backend:
        → POST /api/v1/aggregates {date, avg_sleep_hours, night_screen_minutes, sentiment_label}
        → Backend checks consentFlags.usageTracking
        → Upserts Aggregate document
```

### 3. Journal Entry Flow
```
User writes journal entry
    → onDeviceAIService.analyzeSentiment(text) runs locally
    → localStorageService.saveJournalEntry() encrypts and stores
    → Entry NEVER sent to backend (privacy-first)
```

### 4. Anomaly Detection & Alert Flow
```
Frontend detects wellness drop
    → onDeviceAIService.detectAnomalies() identifies pattern
    → POST /api/v1/alerts/trigger {title, message}
    → Backend fetches user.pushToken
    → Expo.sendPushNotificationsAsync() sends push to device
```

---

## Important Conventions & Patterns

### API Conventions
- **All routes versioned**: `/api/v1/*`
- **Snake_case for API payloads**: `avg_sleep_hours`, `night_screen_minutes`, `sentiment_label`
- **Protected routes**: Use `protect` middleware, access user via `req.user`
- **Consent checks**: Controllers check `req.user.consentFlags` before storing sensitive data

### Frontend Patterns
- **Services are singletons**: Exported as `export default new ServiceClass()`
- **Always initialize**: Call `localStorageService.initialize()` before use
- **Auth state listeners**: Use `authService.addAuthStateListener()` instead of polling
- **Encryption required**: All personal data in `localStorageService` uses AES encryption
- **Platform checks**: Use `Platform.OS` for Android-specific features (UsageStats, HealthConnect)

### Security Practices
- **Passwords**: bcrypt hashed with salt (factor 12)
- **JWTs**: 30-day expiry, contain `userId` only
- **Local encryption**: AES-256-CBC with device-specific key in SecureStore
- **Pseudonymization**: Use `pseudonymId` for backend analytics
- **Consent-driven**: All tracking requires explicit user consent flags

---

## Development Commands

### Backend
```bash
cd backend
npm install
cp .env.example .env  # Add PORT, MONGO_URI, JWT_SECRET
npm run dev           # Starts nodemon on specified PORT
```

### Frontend
```bash
cd frontend
npm install
# Update config/api.js LOCAL_IP to your computer's IP
npm start            # Starts Expo dev server
npm run android      # Run on Android
npm run ios          # Run on iOS
npm run web          # Run in browser
```

### EAS Build (Production)
```bash
npm install -g eas-cli
eas login
eas build --platform android --profile production
```

---

## Common Development Tasks

### Adding a New Protected Route
1. Create controller function in `backend/controllers/`
2. Add route in appropriate `backend/routes/` file
3. Use `protect` middleware: `router.post('/endpoint', protect, controller)`
4. Access user via `req.user` in controller
5. Check consent flags if needed: `if (!req.user.consentFlags.feature) return 403`

### Adding a New Frontend Service
1. Create service in `frontend/services/`
2. Use singleton pattern: `class MyService {}; export default new MyService()`
3. Call `api.post/get()` for backend communication
4. Handle errors with try/catch
5. Update auth state if needed: `authService.notifyAuthStateChange()`

### Adding Local Encrypted Data
1. Add key to `STORAGE_KEYS` in `localStorageService.js`
2. Create `saveXYZ()` and `getXYZ()` methods
3. Always use `this.encrypt()` and `this.decrypt()`
4. Initialize service before use: `await localStorageService.initialize()`

### Testing Network Locally
1. Get computer IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. Update `LOCAL_IP` in `frontend/config/api.js`
3. Ensure device and computer on same WiFi
4. Backend running on PORT (default 3000)
5. Update CORS origins in `backend/server.js` if needed

---

## Debugging Tips

### Backend Issues
- Check `.env` file has all required variables
- Verify MongoDB connection string
- Check console logs for route errors
- Test endpoints with Postman/Thunder Client

### Frontend Issues
- Clear Expo cache: `expo start -c`
- Check `console.log()` output in Metro bundler
- Verify `baseURL` in `config/api.js`
- Ensure JWT token exists: Check AsyncStorage in debugger
- Android permissions: Settings → Apps → Equilibrium → Permissions

### Network Issues
- Verify CORS origins in `server.js`
- Check firewall settings
- Ensure backend is running (`npm run dev`)
- Try `localhost` vs IP address
- Check device WiFi connection

---

## How to Request Code Changes

**After pasting this prompt**, use these templates to request specific modifications:

### 1. Adding New Backend Endpoint
```
Add a new endpoint to [feature name]:
- Route: POST /api/v1/[route]
- Protected: Yes/No
- Purpose: [describe what it does]
- Request body: {field1, field2}
- Response: {field1, field2}
- File: backend/routes/[route].js and backend/controllers/[controller].js
```

### 2. Modifying Database Model
```
Update the [ModelName] model in backend/models/[Model].js:
- Add field: [fieldName] (type: [String/Number/Boolean/Date], required: [yes/no], default: [value])
- Add method: [methodName] that does [description]
- Update index: [index details]
```

### 3. Adding Frontend Screen/Component
```
Create a new screen: [ScreenName]
- Location: frontend/screens/[ScreenName].js
- Purpose: [describe functionality]
- Should include: [list features]
- Navigation: Add to [TabNavigator/Stack]
- Services needed: [authService, localStorageService, etc.]
```

### 4. Modifying Existing Screen
```
Update frontend/screens/[ScreenName].js to:
- Add [new feature/component]
- Modify [existing behavior]
- Connect to [service/API endpoint]
- Handle [edge case/error]
```

### 5. Adding New Service Function
```
Add function to [serviceName].js:
- Function name: [functionName]
- Purpose: [what it does]
- Parameters: [list parameters]
- Returns: [return type and structure]
- Should it call API?: [yes/no, which endpoint]
```

### 6. Updating Configuration
```
Update [config file]:
- Change [setting] from [old value] to [new value]
- Add [new configuration]
- Reason: [why this change is needed]
```

### 7. Adding Consent-Gated Feature
```
Add new feature with consent control:
- Feature name: [name]
- Consent flag: [flagName] (add to User model consentFlags)
- Frontend: Check consent in [screen/service]
- Backend: Enforce consent in [controller/middleware]
- Default value: [true/false]
```

### 8. Debugging/Fixing Issues
```
Fix issue in [filename]:
- Problem: [describe the bug]
- Expected behavior: [what should happen]
- Current behavior: [what's happening]
- Error message (if any): [paste error]
- Affected lines: [approximate location]
```

---

## Example Commands You Can Give

### Understanding Questions:
- "How does the authentication flow work?"
- "Explain the wellness scoring algorithm in onDeviceAIService.js"
- "Where is sleep data calculated and how?"
- "How do consent flags control data collection?"

### Code Modification Requests:
- "Add a 'lastLoginDate' field to the User model that automatically updates on login"
- "Create a new endpoint GET /api/v1/stats/summary that returns user's weekly stats"
- "Update Dashboard.js to show the last 7 days of mood data in a chart"
- "Add a new consent flag 'shareAnonymousData' and enforce it in aggregateController"
- "Create a new screen 'GoalsScreen.js' for setting wellness goals"
- "Fix the authentication error when token expires - add auto-refresh logic"
- "Add a delete button to each journal entry in Journal.js"
- "Update behavioralTrackingService to track app categories, not just individual apps"

### Multi-File Changes:
- "Add a 'streak' system: Update User model, create streakService.js, add streak display to Dashboard.js, and create endpoint to fetch streak data"
- "Implement 'Wellness Goals' feature: Add Goal model, create goal routes and controller, add goalsService.js, create GoalsScreen.js"

---

## Best Practices for Requesting Changes

1. **Be Specific About Files**: Always mention the exact file path when possible
2. **Describe the Purpose**: Explain why the change is needed
3. **Follow Existing Patterns**: Ask AI to maintain consistency with current code style
4. **Consider Consent**: For any data collection feature, specify consent requirements
5. **Think Full-Stack**: If adding a feature, consider both frontend and backend changes
6. **Request Tests**: Ask for manual testing steps after implementation

---

## After AI Makes Changes

**Always review the changes and test:**

1. **Backend Changes**:
   ```bash
   cd backend
   npm run dev
   # Test endpoint with Postman/Thunder Client
   ```

2. **Frontend Changes**:
   ```bash
   cd frontend
   expo start -c  # Clear cache
   # Test on device/simulator
   ```

3. **Database Changes**:
   - If model changed, existing data may need migration
   - Test with fresh data first

4. **Check Consent Logic**:
   - Verify consent flags are respected
   - Test with consent enabled and disabled

The AI has full context about your project structure, patterns, and conventions - use it to build features faster while maintaining code quality!
