# Equilibrium v1 - Build Instructions

## 🚀 Building for Android

### Prerequisites
1. Install Node.js (v16 or higher)
2. Install Expo CLI: `npm install -g @expo/cli`
3. Install EAS CLI: `npm install -g eas-cli`

### Setup Steps

1. **Clone and Install Dependencies**
\`\`\`bash
git clone <your-repo>
cd equilibrium-v1
npm install
\`\`\`

2. **Configure Environment**
\`\`\`bash
# Update config/api.js with your backend URL
# For local development, replace LOCAL_IP with your computer's IP address
\`\`\`

3. **Setup EAS Build**
\`\`\`bash
# Login to Expo
eas login

# Configure project
eas build:configure
\`\`\`

4. **Build APK for Testing**
\`\`\`bash
# Build preview APK
eas build --platform android --profile preview

# Build production APK
eas build --platform android --profile production
\`\`\`

5. **Install on Device**
\`\`\`bash
# Download the APK from the build URL and install on your Android device
# Or use EAS CLI to install directly:
eas build:run --platform android
\`\`\`

### Backend Setup

1. **Start Backend Server**
\`\`\`bash
cd backend
npm install
cp .env.example .env  # Configure your environment variables
npm run dev
\`\`\`

2. **Database Setup**
\`\`\`bash
# Install MongoDB locally or use MongoDB Atlas
# Update MONGODB_URI in .env file
\`\`\`

3. **Network Configuration**
\`\`\`bash
# Find your computer's IP address:
# Windows: ipconfig
# Mac/Linux: ifconfig

# Update config/api.js with your IP address
const LOCAL_IP = "192.168.1.XXX" # Your actual IP
\`\`\`

### Testing the App

1. **Install APK on Android Device**
2. **Ensure device and computer are on same WiFi network**
3. **Start backend server: `npm run dev`**
4. **Open app and test authentication flow**

### Production Deployment

1. **Deploy Backend**
\`\`\`bash
# Deploy to your preferred hosting service (Heroku, Railway, etc.)
# Update PRODUCTION_API_URL in config/api.js
\`\`\`

2. **Build Production APK**
\`\`\`bash
eas build --platform android --profile production
\`\`\`

3. **Submit to Google Play Store**
\`\`\`bash
eas submit --platform android
\`\`\`

## 📱 App Features

- ✅ Complete authentication flow (Login/Register)
- ✅ Encrypted data storage
- ✅ Offline-first architecture
- ✅ Real-time mood tracking
- ✅ Journal entries with sentiment analysis
- ✅ Community support features
- ✅ Emergency contact system
- ✅ Privacy-focused design

## 🔧 Troubleshooting

### Common Issues:

1. **Network Connection Error**
   - Check if backend server is running
   - Verify IP address in config/api.js
   - Ensure device and computer are on same network

2. **Build Errors**
   - Clear Expo cache: `expo r -c`
   - Delete node_modules and reinstall: `rm -rf node_modules && npm install`

3. **Authentication Issues**
   - Check backend logs for errors
   - Verify JWT_SECRET is set in backend .env
   - Clear app data and try again

### Support
For issues, check the logs in:
- Expo Dev Tools (for frontend)
- Backend console (for API errors)
- Device logs (for runtime errors)
