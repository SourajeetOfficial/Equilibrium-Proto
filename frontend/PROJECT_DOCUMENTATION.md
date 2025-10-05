# Equilibrium - Mental Health & Wellness App
## Complete Project Documentation

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture & Technology Stack](#architecture--technology-stack)
3. [Project Structure](#project-structure)
4. [Database Schema](#database-schema)
5. [Core Components](#core-components)
6. [Services & APIs](#services--apis)
7. [Privacy & Security](#privacy--security)
8. [Features & Functionality](#features--functionality)
9. [Setup & Installation](#setup--installation)
10. [How It All Works Together](#how-it-all-works-together)
11. [Development Sprints](#development-sprints)
12. [Troubleshooting](#troubleshooting)

---

## 🎯 Project Overview

**Equilibrium** is a privacy-first mental health and wellness tracking application built with React Native and Expo. The app focuses on helping users monitor their mental health through journaling, mood tracking, wellness scoring, and community support while keeping all sensitive data encrypted and stored locally on the user's device.

### Key Principles:
- **Privacy First**: Sensitive data never leaves the user's device
- **On-Device AI**: Sentiment analysis and wellness insights computed locally
- **Encrypted Storage**: All personal data is encrypted using AES encryption
- **GDPR Compliant**: Full data portability and deletion capabilities
- **Responsive Design**: Works on phones and tablets

### Target Users:
- Individuals seeking to track their mental health
- People who value privacy and data control
- Users wanting insights into their wellness patterns
- Those needing access to mental health resources

---

## 🏗️ Architecture & Technology Stack

### Frontend (React Native/Expo)
\`\`\`
┌─────────────────────────────────────────┐
│                 Frontend                │
├─────────────────────────────────────────┤
│ • React Native 0.73.6                   │
│ • Expo SDK 53                           │
│ • React Navigation 6.x                  │
│ • AsyncStorage (encrypted)              │
│ • Expo SecureStore                      │
│ • CryptoJS (AES encryption)             │
│ • Expo Linear Gradient                  │
│ • Vector Icons                          │
└─────────────────────────────────────────┘
\`\`\`

### Backend (Node.js/Express)
\`\`\`
┌─────────────────────────────────────────┐
│                 Backend                 │
├─────────────────────────────────────────┤
│ • Node.js with Express 5.1.0            │
│ • MongoDB with Mongoose 8.18.0          │
│ • JWT Authentication                    │
│ • bcryptjs for password hashing         │
│ • CORS enabled                          │
│ • Rate limiting                         │
│ • Helmet for security                   │
└─────────────────────────────────────────┘
\`\`\`

### Data Flow Architecture
\`\`\`
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Frontend  │◄──►│   Backend   │◄──►│  Database   │
│             │    │             │    │             │
│ • UI/UX     │    │ • Auth      │    │ • User Data │
│ • Local AI  │    │ • API       │    │ • Aggregates│
│ • Encryption│    │ • Validation│    │ • Forums    │
│ • Storage   │    │ • Security  │    │ • Resources │
└─────────────┘    └─────────────┘    └─────────────┘
\`\`\`

---

## 📁 Project Structure

\`\`\`
equilibrium-frontend/
├── screens/                    # All app screens
│   ├── auth/                  # Authentication screens
│   │   ├── WelcomeScreen.js   # App introduction
│   │   ├── LoginScreen.js     # User login
│   │   └── RegisterScreen.js  # User registration
│   ├── Dashboard.js           # Main dashboard
│   ├── Journal.js             # Private journaling
│   ├── Community.js           # Forum/community
│   ├── Tracker.js             # Usage tracking
│   ├── Emergency.js           # Crisis resources
│   ├── Reports.js             # Wellness reports
│   ├── ProfileScreen.js       # User profile
│   ├── SettingsScreen.js      # App settings
│   ├── HelpDirectoryScreen.js # Professional help
│   └── PrivacySettingsScreen.js # Privacy controls
├── services/                  # Business logic services
│   ├── authService.js         # Authentication
│   ├── localStorageService.js # Local data storage
│   ├── onDeviceAIService.js   # AI processing
│   ├── consentService.js      # Privacy consent
│   ├── dataPortabilityService.js # Data export/import
│   ├── journalService.js      # Journal management
│   ├── wellnessService.js     # Wellness tracking
│   ├── forumService.js        # Community features
│   ├── contactsService.js     # Emergency contacts
│   ├── reportsService.js      # Analytics
│   └── behavioralTrackingService.js # Usage analytics
├── components/                # Reusable UI components
│   ├── SafeAreaWrapper.js     # Safe area handling
│   ├── ResponsiveCard.js      # Adaptive cards
│   └── ResponsiveGrid.js      # Flexible layouts
├── config/                    # Configuration files
│   └── api.js                 # API configuration
├── Backend/                   # Server-side code
│   ├── controllers/           # Request handlers
│   ├── models/               # Database models
│   ├── routes/               # API routes
│   ├── middleware/           # Custom middleware
│   └── server.js             # Main server file
├── App.js                    # Main app component
└── package.json              # Dependencies
\`\`\`

---

## 🗄️ Database Schema

### Frontend Local Storage (Encrypted)

#### Journal Entries
\`\`\`javascript
{
  id: "unique_identifier",
  content: "encrypted_journal_text",
  moodScore: 1-5,
  sentimentLabel: "positive|negative|neutral",
  timestamp: "ISO_date_string",
  createdAt: "ISO_date_string"
}
\`\`\`

#### Wellness Data
\`\`\`javascript
{
  date: "YYYY-MM-DD",
  sleepHours: 7.5,
  moodScore: 4,
  screenTimeMinutes: 240,
  activityMinutes: 30,
  wellnessScore: 85,
  timestamp: "ISO_date_string"
}
\`\`\`

#### Close Contacts (Encrypted)
\`\`\`javascript
{
  id: "unique_identifier",
  name: "encrypted_name",
  phone: "encrypted_phone",
  relationship: "friend|family|therapist|doctor",
  isEmergency: true|false,
  createdAt: "ISO_date_string"
}
\`\`\`

#### App Usage Tracking
\`\`\`javascript
{
  date: "YYYY-MM-DD",
  pickupCount: 25,
  totalScreenTime: 180, // minutes
  sessionData: [
    {
      startTime: "ISO_date_string",
      endTime: "ISO_date_string",
      duration: 15 // minutes
    }
  ]
}
\`\`\`

### Backend Database (MongoDB)

#### User Model
\`\`\`javascript
{
  _id: ObjectId,
  email: "user@example.com",
  passwordHash: "bcrypt_hashed_password",
  pseudonymId: "anonymous_identifier",
  consentFlags: {
    usageTracking: true|false,
    cloudSync: true|false,
    emergencyContacts: true|false,
    anonymousAnalytics: true|false,
    crashReporting: true|false
  },
  createdAt: Date,
  updatedAt: Date
}
\`\`\`

#### Aggregate Data Model
\`\`\`javascript
{
  _id: ObjectId,
  pseudonymId: "anonymous_user_id",
  date: "YYYY-MM-DD",
  aggregatedMetrics: {
    averageWellnessScore: 75,
    moodTrend: "improving|stable|declining",
    usagePatterns: {
      avgScreenTime: 240,
      avgPickups: 30
    }
  },
  createdAt: Date
}
\`\`\`

#### Forum Post Model
\`\`\`javascript
{
  _id: ObjectId,
  authorPseudonym: "anonymous_author_id",
  title: "Post title",
  content: "Post content",
  category: "general|support|resources",
  tags: ["anxiety", "depression"],
  upvotes: 15,
  downvotes: 2,
  isAnonymous: true,
  createdAt: Date,
  updatedAt: Date
}
\`\`\`

#### Professional Help Model
\`\`\`javascript
{
  _id: ObjectId,
  name: "Dr. Jane Smith",
  type: "therapist|psychiatrist|counselor|crisis_line",
  specialties: ["anxiety", "depression", "trauma"],
  contactInfo: {
    phone: "+1234567890",
    email: "contact@example.com",
    website: "https://example.com"
  },
  location: {
    address: "123 Main St",
    city: "New York",
    state: "NY",
    zipCode: "10001",
    coordinates: {
      lat: 40.7128,
      lng: -74.0060
    }
  },
  availability: {
    acceptingNewPatients: true,
    emergencyAvailable: false,
    languages: ["English", "Spanish"]
  },
  verified: true,
  createdAt: Date,
  updatedAt: Date
}
\`\`\`

---

## 🧩 Core Components

### 1. SafeAreaWrapper Component
**Purpose**: Handles safe areas on modern devices (notches, gesture bars)

\`\`\`javascript
// Usage: Wraps screens to avoid UI overlap
<SafeAreaWrapper backgroundColor="#dbeafe" statusBarStyle="dark-content">
  <YourScreenContent />
</SafeAreaWrapper>
\`\`\`

**Features**:
- Automatic safe area detection
- Cross-platform status bar handling
- Customizable background colors
- Edge-specific padding control

### 2. ResponsiveCard Component
**Purpose**: Adaptive card layouts for different screen sizes

\`\`\`javascript
// Usage: Container for content sections
<ResponsiveCard style={styles.customCard} backgroundColor="rgba(255,255,255,0.9)">
  <Text>Card Content</Text>
</ResponsiveCard>
\`\`\`

**Features**:
- Automatic tablet/phone adaptation
- Shadow and elevation effects
- Customizable backgrounds
- Rounded corners and padding

### 3. ResponsiveGrid Component
**Purpose**: Flexible grid layouts that adapt to screen size

\`\`\`javascript
// Usage: Organize content in grids
<ResponsiveGrid columns={2} spacing={12}>
  <GridItem1 />
  <GridItem2 />
  <GridItem3 />
  <GridItem4 />
</ResponsiveGrid>
\`\`\`

**Features**:
- Dynamic column adjustment
- Consistent spacing
- Tablet optimization
- Flexible item sizing

---

## 🔧 Services & APIs

### 1. Authentication Service (`authService.js`)
**Purpose**: Manages user authentication and session handling

**Key Methods**:
\`\`\`javascript
// Initialize authentication state
await authService.initializeAuth()

// Register new user
const result = await authService.register({
  email: "user@example.com",
  password: "securePassword"
})

// Login user
const result = await authService.login(email, password)

// Logout user
await authService.logout()

// Check authentication status
const isAuth = authService.isAuthenticated()

// Get current user
const user = authService.getCurrentUser()
\`\`\`

**Features**:
- JWT token management
- Automatic token refresh
- Secure password handling
- Session persistence
- Auth state listeners

### 2. Local Storage Service (`localStorageService.js`)
**Purpose**: Encrypted local data storage and management

**Key Methods**:
\`\`\`javascript
// Initialize storage
await localStorageService.initialize()

// Save journal entry
const entry = await localStorageService.saveJournalEntry({
  content: "Today was a good day...",
  moodScore: 4,
  sentimentLabel: "positive"
})

// Get journal entries
const entries = await localStorageService.getJournalEntries(10)

// Save wellness data
await localStorageService.saveWellnessData("2024-01-15", {
  sleepHours: 7.5,
  moodScore: 4,
  screenTimeMinutes: 240,
  activityMinutes: 30,
  wellnessScore: 85
})

// Export all data
const exportData = await localStorageService.exportAllData()
\`\`\`

**Features**:
- AES encryption for sensitive data
- Automatic data compression
- Efficient querying
- Data validation
- Export/import capabilities

### 3. On-Device AI Service (`onDeviceAIService.js`)
**Purpose**: Local AI processing for privacy-preserving analytics

**Key Methods**:
\`\`\`javascript
// Initialize AI models
await onDeviceAIService.initialize()

// Analyze sentiment
const sentiment = onDeviceAIService.analyzeSentiment("I feel great today!")
// Returns: { score: 4, confidence: 85, label: "positive" }

// Calculate wellness score
const score = onDeviceAIService.calculateWellnessScore({
  sleepHours: 7.5,
  moodScore: 4,
  screenTimeMinutes: 240,
  activityMinutes: 30
})

// Generate insights
const insights = onDeviceAIService.generateWellnessInsights(wellnessData)

// Detect anomalies
const anomalies = onDeviceAIService.detectAnomalies(wellnessData)
\`\`\`

**Features**:
- Keyword-based sentiment analysis
- Wellness score algorithms
- Pattern recognition
- Anomaly detection
- Personalized recommendations

### 4. Data Portability Service (`dataPortabilityService.js`)
**Purpose**: GDPR-compliant data export, import, and deletion

**Key Methods**:
\`\`\`javascript
// Export user data
const exportResult = await dataPortabilityService.exportAllData(userId)

// Import data from file
const importResult = await dataPortabilityService.importData()

// Get data summary
const summary = await dataPortabilityService.getDataSummary(userId)

// Delete all user data
const deleteResult = await dataPortabilityService.deleteAllData(userId, password)
\`\`\`

**Features**:
- JSON/CSV export formats
- Data validation on import
- Complete data deletion
- Storage statistics
- File sharing integration

---

## 🔒 Privacy & Security

### Encryption Strategy
\`\`\`
┌─────────────────────────────────────────────────────────┐
│                    Data Classification                  │
├─────────────────────────────────────────────────────────┤
│ HIGHLY SENSITIVE (AES Encrypted + Local Only)           │
│ • Journal entries                                       │
│ • Personal contacts                                     │
│ • Detailed mood data                                    │
│ • Usage patterns                                        │
├─────────────────────────────────────────────────────────┤
│ MODERATELY SENSITIVE (Pseudonymized + Server)           │
│ • Aggregated wellness scores                            │
│ • Anonymous forum posts                                 │
│ • General usage statistics                              │
├─────────────────────────────────────────────────────────┤
│ NON-SENSITIVE (Plain Text + Server)                     │
│ • Public forum content                                  │
│ • Professional help directory                           │
│ • App configuration                                     │
└─────────────────────────────────────────────────────────┘
\`\`\`

### Privacy Features

#### 1. Local-First Architecture
- **Journal entries**: Never leave the device
- **Personal contacts**: Encrypted locally only
- **Detailed mood data**: Processed on-device
- **Usage patterns**: Analyzed locally

#### 2. Pseudonymization
- Users get anonymous IDs for server interactions
- Real identity never linked to behavioral data
- Forum posts use pseudonyms
- Aggregated data cannot be traced back

#### 3. Granular Consent
\`\`\`javascript
const consentFlags = {
  usageTracking: false,        // Share anonymous usage stats
  cloudSync: false,            // Backup aggregated data
  emergencyContacts: true,     // Store emergency contacts
  anonymousAnalytics: false,   // Help improve the app
  crashReporting: true         // Send crash reports
}
\`\`\`

#### 4. Data Minimization
- Only collect necessary data
- Automatic data expiration
- User-controlled retention periods
- Regular data cleanup

### Security Measures

#### 1. Encryption
\`\`\`javascript
// AES-256 encryption for sensitive data
const encrypted = CryptoJS.AES.encrypt(sensitiveData, encryptionKey).toString()
const decrypted = CryptoJS.AES.decrypt(encrypted, encryptionKey).toString(CryptoJS.enc.Utf8)
\`\`\`

#### 2. Authentication
\`\`\`javascript
// JWT tokens with expiration
const token = jwt.sign({ userId, pseudonymId }, JWT_SECRET, { expiresIn: '7d' })

// Password hashing
const hashedPassword = await bcrypt.hash(password, 12)
\`\`\`

#### 3. API Security
- Rate limiting to prevent abuse
- CORS configuration
- Helmet for security headers
- Input validation and sanitization

---

## ✨ Features & Functionality

### 1. Dashboard
**What it does**: Central hub showing wellness overview and quick actions

**Key Features**:
- Real-time wellness score calculation
- Today's highlights (sleep, mood, screen time, pickups)
- Quick mood check-in buttons
- Recent journal entry previews
- Personalized insights and recommendations
- Emergency support access

**How it works**:
1. Loads user data from local storage
2. Calculates wellness metrics using AI service
3. Generates insights based on patterns
4. Displays responsive cards with information
5. Provides quick actions for common tasks

### 2. Private Journal
**What it does**: Secure, encrypted journaling with sentiment analysis

**Key Features**:
- End-to-end encrypted entries
- Mood tracking with each entry
- Automatic sentiment analysis
- Search and filter capabilities
- Export/backup options
- Privacy indicators

**How it works**:
1. User writes journal entry
2. Content is encrypted before storage
3. AI analyzes sentiment locally
4. Entry is saved with metadata
5. Insights are generated from patterns
6. Data never leaves the device

### 3. Wellness Tracking
**What it does**: Comprehensive wellness monitoring and scoring

**Key Features**:
- Multi-factor wellness scoring
- Sleep pattern tracking
- Screen time monitoring
- Activity level recording
- Mood trend analysis
- Anomaly detection

**How it works**:
1. Collects data from multiple sources
2. Applies weighted scoring algorithm
3. Detects patterns and anomalies
4. Generates personalized insights
5. Provides actionable recommendations
6. Tracks progress over time

### 4. Community Forum
**What it does**: Anonymous peer support and discussion

**Key Features**:
- Pseudonymous posting
- Category-based discussions
- Upvoting/downvoting system
- Content moderation
- Crisis intervention detection
- Professional resource sharing

**How it works**:
1. Users post with pseudonyms
2. Content is moderated for safety
3. AI detects crisis language
4. Community votes on helpfulness
5. Professional resources are suggested
6. Emergency protocols activate if needed

### 5. Help Directory
**What it does**: Curated database of mental health professionals

**Key Features**:
- Location-based search
- Specialty filtering
- Availability status
- Contact information
- User reviews and ratings
- Insurance compatibility
- Crisis hotlines

**How it works**:
1. Professionals register and verify
2. Users search by location/specialty
3. Filtering by availability and insurance
4. Direct contact facilitation
5. Review and rating system
6. Emergency resources highlighted

### 6. Privacy Controls
**What it does**: Comprehensive privacy and data management

**Key Features**:
- Granular consent management
- Data export in multiple formats
- Complete data deletion
- Storage usage statistics
- Consent history tracking
- Privacy education

**How it works**:
1. Users set consent preferences
2. Data handling adapts to choices
3. Export generates comprehensive files
4. Deletion removes all traces
5. Statistics show data usage
6. Education explains privacy features

---

## 🚀 Setup & Installation

### Prerequisites
\`\`\`bash
# Required software
Node.js >= 18.0.0
npm >= 8.0.0
Expo CLI >= 6.0.0
MongoDB >= 6.0.0

# For mobile development
Android Studio (for Android)
Xcode (for iOS, macOS only)
\`\`\`

### Frontend Setup
\`\`\`bash
# 1. Clone the repository
git clone https://github.com/your-repo/equilibrium-frontend.git
cd equilibrium-frontend

# 2. Install dependencies
npm install

# 3. Install additional packages
npm install expo@~50.0.0 react@18.2.0 react-native@0.73.6 @react-navigation/native@^6.1.9 @react-navigation/bottom-tabs@^6.5.11 @react-navigation/stack@^6.3.20 react-native-screens@~3.29.0 react-native-safe-area-context@4.8.2 expo-linear-gradient@~12.7.2 @expo/vector-icons@^14.0.0 @react-native-async-storage/async-storage@1.21.0 crypto-js@^4.2.0 axios@^1.6.0 expo-document-picker@~11.10.1 expo-file-system@~16.0.6 expo-sharing@~11.10.0 expo-status-bar@~1.11.1 react-native-gesture-handler@~2.14.0

# 4. Start the development server
npm start

# 5. Run on specific platforms
npm run android  # For Android
npm run ios      # For iOS
\`\`\`

### Backend Setup
\`\`\`bash
# 1. Navigate to backend directory
cd Backend

# 2. Install backend dependencies
npm install

# 3. Create environment file
cp .env.example .env

# 4. Configure environment variables
# Edit .env file with your settings:
MONGODB_URI=mongodb://localhost:27017/equilibrium
JWT_SECRET=your-super-secret-jwt-key
PORT=3000
NODE_ENV=development

# 5. Start MongoDB
mongod --dbpath /path/to/your/db

# 6. Start the backend server
npm start
\`\`\`

### Environment Configuration
\`\`\`bash
# Frontend (.env)
API_BASE_URL=http://localhost:3000/api
ENCRYPTION_KEY=your-encryption-key-here

# Backend (.env)
MONGODB_URI=mongodb://localhost:27017/equilibrium
JWT_SECRET=your-jwt-secret-here
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
\`\`\`

### Database Setup
\`\`\`javascript
// MongoDB collections will be created automatically
// Initial data seeding (optional)
const seedData = {
  professionalHelp: [
    {
      name: "Crisis Text Line",
      type: "crisis_line",
      contactInfo: { phone: "741741" },
      availability: { emergencyAvailable: true }
    }
  ]
}
\`\`\`

---

## ⚙️ How It All Works Together

### Application Flow
\`\`\`
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    User     │    │  Frontend   │    │   Backend   │
│             │    │             │    │             │
│ 1. Opens    │───►│ 2. Loads    │───►│ 3. Verifies │
│    App      │    │    Auth     │    │    Token    │
│             │    │             │    │             │
│ 4. Sees     │◄───│ 5. Shows    │◄───│ 6. Returns  │
│    Dashboard│    │    UI       │    │    Data     │
│             │    │             │    │             │
│ 7. Writes   │───►│ 8. Encrypts │    │             │
│    Journal  │    │    & Stores │    │             │
│             │    │    Locally  │    │             │
│             │    │             │    │             │
│ 9. Views    │◄───│10. Processes│    │             │
│    Insights │    │    with AI  │    │             │
└─────────────┘    └─────────────┘    └─────────────┘
\`\`\`

### Data Processing Pipeline
\`\`\`
┌─────────────────────────────────────────────────────────┐
│                    Data Pipeline                        │
├─────────────────────────────────────────────────────────┤
│ 1. User Input                                           │
│    ├── Journal Entry                                    │
│    ├── Mood Rating                                      │
│    ├── Sleep Hours                                      │
│    └── Activity Data                                    │
│                                                         │
│ 2. Local Processing                                     │
│    ├── Encrypt Sensitive Data                           │
│    ├── Analyze Sentiment                                │
│    ├── Calculate Wellness Score                         │
│    └── Detect Patterns                                  │
│                                                         │
│ 3. Storage Decision                                     │
│    ├── Sensitive → Local Storage (Encrypted)            │
│    ├── Aggregated → Server (Pseudonymized)              │
│    └── Public → Server (Plain Text)                     │
│                                                         │
│ 4. Insight Generation                                   │
│    ├── Trend Analysis                                   │
│    ├── Anomaly Detection                                │
│    ├── Personalized Recommendations                     │
│    └── Crisis Intervention Triggers                     │
└─────────────────────────────────────────────────────────┘
\`\`\`

### Privacy-First Architecture
\`\`\`
┌─────────────────────────────────────────────────────────┐
│                  Privacy Layers                         │
├─────────────────────────────────────────────────────────┤
│ Layer 1: Data Classification                            │
│ ├── Highly Sensitive (Local Only)                       │
│ ├── Moderately Sensitive (Pseudonymized)                │
│ └── Non-Sensitive (Public)                              │
│                                                         │
│ Layer 2: Processing Location                            │
│ ├── On-Device AI (Sensitive Analysis)                   │
│ ├── Edge Processing (Aggregation)                       │
│ └── Server Processing (Public Data)                     │
│                                                         │
│ Layer 3: Storage Strategy                               │
│ ├── Local Encrypted Storage                             │
│ ├── Pseudonymized Server Storage                        │
│ └── Public Server Storage                               │
│                                                         │
│ Layer 4: User Control                                   │
│ ├── Granular Consent                                    │
│ ├── Data Export                                         │
│ ├── Data Deletion                                       │
│ └── Transparency Reports                                │
└─────────────────────────────────────────────────────────┘
\`\`\`

---

## 📈 Development Sprints

### Sprint 1: Foundation & Core Features
**Duration**: 2 weeks
**Goals**: Basic app structure and essential functionality

**Deliverables**:
- ✅ Authentication system
- ✅ Basic UI components
- ✅ Local storage setup
- ✅ Journal functionality
- ✅ Dashboard layout

### Sprint 2: Privacy & Security
**Duration**: 2 weeks
**Goals**: Implement privacy-first architecture

**Deliverables**:
- ✅ Data encryption
- ✅ Consent management
- ✅ Privacy controls
- ✅ Secure storage
- ✅ GDPR compliance

### Sprint 3: AI & Analytics
**Duration**: 2 weeks
**Goals**: On-device intelligence and insights

**Deliverables**:
- ✅ Sentiment analysis
- ✅ Wellness scoring
- ✅ Pattern recognition
- ✅ Anomaly detection
- ✅ Personalized insights

### Sprint 4: Community & Support
**Duration**: 2 weeks
**Goals**: Social features and professional resources

**Deliverables**:
- ✅ Anonymous forum
- ✅ Help directory
- ✅ Crisis intervention
- ✅ Professional matching
- ✅ Emergency resources

### Sprint 5: Data Rights & Polish
**Duration**: 2 weeks
**Goals**: Complete data portability and final polish

**Deliverables**:
- ✅ Data export/import
- ✅ Account deletion
- ✅ Privacy dashboard
- ✅ Performance optimization
- ✅ Responsive design

---

## 🔧 Troubleshooting

### Common Issues

#### 1. "topInsetsChange" Error
**Problem**: Safe area context version mismatch
**Solution**:
\`\`\`bash
npm install react-native-safe-area-context@4.8.2
# Restart the development server
npm start -- --reset-cache
\`\`\`

#### 2. Encryption/Decryption Errors
**Problem**: CryptoJS compatibility issues
**Solution**:
\`\`\`bash
npm install crypto-js@^4.2.0
# Clear storage and restart
\`\`\`

#### 3. Navigation Issues
**Problem**: React Navigation version conflicts
**Solution**:
\`\`\`bash
npm install @react-navigation/native@^6.1.9 @react-navigation/bottom-tabs@^6.5.11 @react-navigation/stack@^6.3.20
\`\`\`

#### 4. Database Connection Issues
**Problem**: MongoDB connection failures
**Solution**:
\`\`\`bash
# Check MongoDB status
mongod --version
# Start MongoDB service
brew services start mongodb/brew/mongodb-community
# Or on Linux
sudo systemctl start mongod
\`\`\`

#### 5. Build Errors
**Problem**: Expo/React Native build issues
**Solution**:
\`\`\`bash
# Clear cache
expo start --clear
# Reset Metro bundler
npx react-native start --reset-cache
# Clean install
rm -rf node_modules package-lock.json
npm install
\`\`\`

### Performance Optimization

#### 1. Memory Management
\`\`\`javascript
// Implement proper cleanup in useEffect
useEffect(() => {
  const subscription = someService.subscribe()
  return () => subscription.unsubscribe()
}, [])
\`\`\`

#### 2. Storage Optimization
\`\`\`javascript
// Limit stored data
const MAX_JOURNAL_ENTRIES = 100
const MAX_WELLNESS_DATA_DAYS = 365

// Implement data cleanup
await localStorageService.cleanupOldData()
\`\`\`

#### 3. UI Performance
\`\`\`javascript
// Use FlatList for large datasets
<FlatList
  data={journalEntries}
  renderItem={renderJournalEntry}
  keyExtractor={item => item.id}
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
/>
\`\`\`

### Security Best Practices

#### 1. Key Management
\`\`\`javascript
// Never hardcode encryption keys
const ENCRYPTION_KEY = await SecureStore.getItemAsync('encryption_key')

// Rotate keys periodically
await rotateEncryptionKey()
\`\`\`

#### 2. Data Validation
\`\`\`javascript
// Validate all inputs
const validateJournalEntry = (entry) => {
  if (!entry.content || entry.content.length > 10000) {
    throw new Error('Invalid journal entry')
  }
}
\`\`\`

#### 3. Error Handling
\`\`\`javascript
// Implement comprehensive error handling
try {
  await sensitiveOperation()
} catch (error) {
  console.error('Operation failed:', error)
  // Don't expose sensitive information
  showUserFriendlyError()
}
\`\`\`

---

## 📞 Support & Resources

### Documentation
- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [Expo Documentation](https://docs.expo.dev/)
- [MongoDB Manual](https://docs.mongodb.com/manual/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)

### Mental Health Resources
- National Suicide Prevention Lifeline: 988
- Crisis Text Line: Text HOME to 741741
- NAMI (National Alliance on Mental Illness): 1-800-950-NAMI

### Development Resources
- [React Navigation](https://reactnavigation.org/docs/getting-started)
- [AsyncStorage](https://react-native-async-storage.github.io/async-storage/)
- [CryptoJS Documentation](https://cryptojs.gitbook.io/docs/)

---

## 🎯 Future Enhancements

### Planned Features
1. **Biometric Authentication** - Fingerprint/Face ID login
2. **Wearable Integration** - Apple Watch/Fitbit data sync
3. **Offline Mode** - Full functionality without internet
4. **Multi-language Support** - Internationalization
5. **Advanced AI Models** - More sophisticated sentiment analysis
6. **Telehealth Integration** - Direct video calls with professionals
7. **Family Sharing** - Controlled sharing with trusted contacts
8. **Research Participation** - Opt-in anonymous research studies

### Technical Improvements
1. **Performance Optimization** - Faster app startup and navigation
2. **Battery Optimization** - Reduced background processing
3. **Accessibility** - Full screen reader and voice control support
4. **Testing Coverage** - Comprehensive unit and integration tests
5. **CI/CD Pipeline** - Automated testing and deployment
6. **Monitoring** - Real-time error tracking and performance metrics

---

This documentation provides a comprehensive overview of the Equilibrium mental health app. The project demonstrates a privacy-first approach to mental health technology, combining local AI processing with secure cloud services to provide users with powerful insights while maintaining complete control over their sensitive data.

For additional questions or support, please refer to the troubleshooting section or contact the development team.
