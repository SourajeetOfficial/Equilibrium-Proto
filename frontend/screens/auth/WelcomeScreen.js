import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const { width, height } = Dimensions.get("window")

export default function WelcomeScreen({ navigation }) {
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient colors={["#dbeafe", "#d1fae5", "#fef3c7"]} style={styles.gradient}>
        <View style={styles.content}>
          {/* Logo/Icon */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Ionicons name="heart" size={48} color="#059669" />
            </View>
            <Text style={styles.appName}>Equilibrium</Text>
            <Text style={styles.version}>v1.0</Text>
          </View>

          {/* Welcome Content */}
          <View style={styles.welcomeContent}>
            <Text style={styles.welcomeTitle}>Welcome to Your Mental Wellness Journey</Text>
            <Text style={styles.welcomeSubtitle}>
              Track your mood, journal your thoughts, and connect with a supportive community. Your privacy and
              well-being are our top priorities.
            </Text>

            {/* Features */}
            <View style={styles.featuresContainer}>
              <View style={styles.feature}>
                <Ionicons name="shield-checkmark" size={20} color="#059669" />
                <Text style={styles.featureText}>End-to-end encrypted</Text>
              </View>
              <View style={styles.feature}>
                <Ionicons name="heart" size={20} color="#059669" />
                <Text style={styles.featureText}>Mood tracking & insights</Text>
              </View>
              <View style={styles.feature}>
                <Ionicons name="people" size={20} color="#059669" />
                <Text style={styles.featureText}>Anonymous community support</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate("Register")}>
              <Text style={styles.primaryButtonText}>Get Started</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate("Login")}>
              <Text style={styles.secondaryButtonText}>I already have an account</Text>
            </TouchableOpacity>
          </View>

          {/* Privacy Note */}
          <View style={styles.privacyNote}>
            <Ionicons name="lock-closed" size={16} color="#6b7280" />
            <Text style={styles.privacyText}>Your data is encrypted and private. We never share your information.</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "space-between",
    paddingVertical: 40,
  },
  logoContainer: {
    alignItems: "center",
    marginTop: height * 0.1,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  appName: {
    fontSize: 32,
    fontWeight: "300",
    color: "#374151",
    marginBottom: 4,
  },
  version: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  welcomeContent: {
    alignItems: "center",
    paddingHorizontal: 8,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#374151",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 32,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  featuresContainer: {
    gap: 16,
    width: "100%",
  },
  feature: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  featureText: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: "#059669",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  secondaryButtonText: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "500",
  },
  privacyNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  privacyText: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
    flex: 1,
  },
})
