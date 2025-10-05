// Emergency.js
import { useState, useEffect } from "react"
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking, Alert } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
import SafeAreaWrapper from "../components/SafeAreaWrapper"
import contactsService from "../services/contactsService"
import { useSafeAreaInsets } from "react-native-safe-area-context"

export default function Emergency({ navigation }) {
  const insets = useSafeAreaInsets()
  const [personalContacts, setPersonalContacts] = useState([])

  useEffect(() => {
    loadContacts()
  }, [])

  const loadContacts = async () => {
    const localContactsResult = await contactsService.getCloseContacts()
    const emergencyContactsResult = await contactsService.getEmergencyContacts()

    const allContacts = [
      ...(localContactsResult.contacts || []).map(c => ({ ...c, type: 'close' })),
      ...(emergencyContactsResult.contacts || []).map(c => ({ ...c, type: 'emergency' }))
    ]

    setPersonalContacts(allContacts)
  }

  const handleCall = (number) => {
    Linking.openURL(`tel:${number}`)
  }

  const handleText = (number) => {
    Linking.openURL(`sms:${number}`)
  }

  const supportOptions = [
    {
      icon: "call",
      title: "Schedule Therapy",
      subtitle: "Professional counseling",
      color: "#3b82f6",
      bgColor: "#dbeafe",
      onPress: () => navigation.navigate("HelpDirectory"),
    },
    {
      icon: "chatbubble",
      title: "Chat with Counselor",
      subtitle: "Online support available",
      color: "#8b5cf6",
      bgColor: "#ede9fe",
      onPress: () => Alert.alert("Feature Coming Soon", "This feature is not yet implemented."),
    },
    {
      icon: "people",
      title: "Join Support Group",
      subtitle: "Connect with others",
      color: "#10b981",
      bgColor: "#d1fae5",
      onPress: () => navigation.navigate("Community"),
    },
  ];

  const copingStrategies = [
    {
      title: "Breathing Exercise",
      description: "Breathe in for 4, hold for 4, breathe out for 6",
      color: "#6366f1",
      bgColor: "#e0e7ff",
      onPress: () => Alert.alert("Breathing Exercise", "Inhale slowly for 4 seconds, hold for 4, exhale for 6 seconds. Repeat as needed."),
    },
    {
      title: "Grounding Technique",
      description: "5 things you see, 4 you hear, 3 you touch",
      color: "#10b981",
      bgColor: "#d1fae5",
      onPress: () => Alert.alert("Grounding Technique", "Acknowledge 5 things you can see, 4 things you can hear, 3 things you can touch, 2 things you can smell, and 1 thing you can taste."),
    },
  ];

  return (
    <SafeAreaWrapper backgroundColor="#dbeafe" statusBarStyle="dark-content">
      <View style={styles.statusBarBg} />
      <LinearGradient colors={["#fecaca", "#fda4af"]} style={styles.gradient}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={20} color="#64748b" />
            </TouchableOpacity>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>You're Not Alone</Text>
              <Text style={styles.headerSubtitle}>Help is available 24/7</Text>
            </View>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Immediate Help */}
          <View style={styles.emergencyCard}>
            <View style={styles.emergencyHeader}>
              <View style={styles.emergencyIcon}>
                <Ionicons name="alert-circle" size={24} color="#ffffff" />
              </View>
              <Text style={styles.emergencyTitle}>Need Immediate Help?</Text>
            </View>
            <View style={styles.emergencyActions}>
              <TouchableOpacity style={styles.crisisButton} onPress={() => handleCall("988")}>
                <Ionicons name="call" size={24} color="#ffffff" />
                <Text style={styles.crisisButtonText}>Call Crisis Hotline</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.textButton} onPress={() => handleText("741741")}>
                <Ionicons name="chatbubble" size={24} color="#dc2626" />
                <Text style={styles.textButtonText}>Text Support</Text>
              </TouchableOpacity>
              <View style={styles.hotlineInfo}>
                <Text style={styles.hotlineText}>
                  <Text style={styles.hotlineBold}>Crisis Hotline:</Text> 988
                </Text>
                <Text style={styles.hotlineSubtext}>Available 24/7 - Free & Confidential</Text>
              </View>
            </View>
          </View>

          {/* Support Options */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Other Support Options</Text>
            <View style={styles.supportCard}>
              {supportOptions.map((option, index) => (
                <TouchableOpacity key={index} style={styles.supportOption} onPress={option.onPress}>
                  <View style={[styles.supportIcon, { backgroundColor: option.bgColor }]}>
                    <Ionicons name={option.icon} size={20} color={option.color} />
                  </View>
                  <View style={styles.supportText}>
                    <Text style={styles.supportTitle}>{option.title}</Text>
                    <Text style={styles.supportSubtitle}>{option.subtitle}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Personal Contacts */}
          <View style={styles.personalCard}>
            <View style={styles.personalHeader}>
              <Ionicons name="heart" size={20} color="#ec4899" />
              <Text style={styles.personalTitle}>Personal Support</Text>
            </View>
            <View style={styles.personalContacts}>
              {personalContacts.length > 0 ? (
                personalContacts.map((contact, index) => (
                  <View key={index} style={[styles.contactRow, { backgroundColor: contact.type === 'close' ? "#fce7f3" : "#ede9fe" }]}>
                    <View style={[styles.contactIcon, { backgroundColor: contact.type === 'close' ? "#fce7f3" : "#ede9fe" }]}>
                      <Ionicons name={contact.type === 'close' ? "call" : "chatbubble"} size={20} color={contact.type === 'close' ? "#ec4899" : "#8b5cf6"} />
                    </View>
                    <View style={styles.contactText}>
                      <Text style={styles.contactName}>{contact.name}</Text>
                      <Text style={styles.contactSubtitle}>{contact.type === 'close' ? 'Close Contact' : 'Emergency Contact'}</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.contactButton, { borderColor: contact.type === 'close' ? "#ec4899" : "#8b5cf6" }]}
                      onPress={() => handleCall(contact.phone)}
                    >
                      <Text style={[styles.contactButtonText, { color: contact.type === 'close' ? "#ec4899" : "#8b5cf6" }]}>Call</Text>
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <View style={styles.emptyContacts}>
                  <Text style={styles.emptyContactsText}>No personal contacts added. Add them in settings to see them here.</Text>
                </View>
              )}
            </View>
          </View>

          {/* Coping Strategies */}
          <View style={styles.copingCard}>
            <View style={styles.copingHeader}>
              <Ionicons name="time" size={20} color="#6366f1" />
              <Text style={styles.copingTitle}>While You Wait</Text>
            </View>
            <View style={styles.copingStrategies}>
              {copingStrategies.map((strategy, index) => (
                <View key={index} style={[styles.strategyCard, { backgroundColor: strategy.bgColor }]}>
                  <Text style={[styles.strategyTitle, { color: strategy.color }]}>{strategy.title}</Text>
                  <Text style={[styles.strategyDescription, { color: strategy.color }]}>{strategy.description}</Text>
                  <TouchableOpacity style={[styles.strategyButton, { backgroundColor: strategy.color }]} onPress={strategy.onPress}>
                    <Text style={styles.strategyButtonText}>{index === 0 ? "Start Exercise" : "Try Now"}</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          {/* Reassurance */}
          <View style={styles.reassuranceCard}>
            <Ionicons name="heart" size={48} color="#3b82f6" style={styles.reassuranceIcon} />
            <Text style={styles.reassuranceTitle}>Remember</Text>
            <Text style={styles.reassuranceText}>
              You are valued, you matter, and seeking help is a sign of strength. This difficult moment will pass.
            </Text>
          </View>

          <View style={{ height: 50 }} />
        </ScrollView>
      </LinearGradient>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statusBarBg: {
    height: 0,
    backgroundColor: "#fecaca",
  },
  gradient: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerText: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "300",
    color: "#374151",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6b7280",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emergencyCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  emergencyHeader: {
    backgroundColor: "#dc2626",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingVertical: 20,
    alignItems: "center",
  },
  emergencyIcon: {
    width: 48,
    height: 48,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  emergencyTitle: {
    fontSize: 18,
    fontWeight: "500",
    color: "#ffffff",
  },
  emergencyActions: {
    padding: 24,
    gap: 16,
  },
  crisisButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: "#dc2626",
    paddingVertical: 16,
    borderRadius: 8,
  },
  crisisButtonText: {
    fontSize: 18,
    color: "#ffffff",
    fontWeight: "500",
  },
  textButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#fca5a5",
    paddingVertical: 16,
    borderRadius: 8,
  },
  textButtonText: {
    fontSize: 18,
    color: "#dc2626",
    fontWeight: "500",
  },
  hotlineInfo: {
    backgroundColor: "#fef2f2",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  hotlineText: {
    fontSize: 14,
    color: "#b91c1c",
  },
  hotlineBold: {
    fontWeight: "600",
  },
  hotlineSubtext: {
    fontSize: 12,
    color: "#dc2626",
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 16,
  },
  supportCard: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 12,
    padding: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  supportOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 8,
  },
  supportIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  supportText: {
    flex: 1,
  },
  supportTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  supportSubtitle: {
    fontSize: 12,
    color: "#6b7280",
  },
  personalCard: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  personalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  personalTitle: {
    fontSize: 18,
    fontWeight: "500",
    color: "#374151",
  },
  personalContacts: {
    gap: 12,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 8,
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  contactText: {
    flex: 1,
  },
  contactName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  contactSubtitle: {
    fontSize: 12,
    color: "#6b7280",
  },
  contactButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    backgroundColor: "transparent",
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  copingCard: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  copingHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  copingTitle: {
    fontSize: 18,
    fontWeight: "500",
    color: "#374151",
  },
  copingStrategies: {
    gap: 12,
  },
  strategyCard: {
    borderRadius: 8,
    padding: 16,
  },
  strategyTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  strategyDescription: {
    fontSize: 14,
    marginBottom: 12,
  },
  strategyButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  strategyButtonText: {
    fontSize: 14,
    color: "#ffffff",
    fontWeight: "500",
  },
  reassuranceCard: {
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
  },
  reassuranceIcon: {
    marginBottom: 16,
  },
  reassuranceTitle: {
    fontSize: 18,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 12,
  },
  reassuranceText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
  },
  emptyContacts: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(243, 244, 246, 0.8)',
    borderRadius: 8,
  },
  emptyContactsText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
})