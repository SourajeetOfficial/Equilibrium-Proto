"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  Linking,
  Dimensions,
  ActivityIndicator,
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import SafeAreaWrapper from "../components/SafeAreaWrapper"
import ResponsiveCard from "../components/ResponsiveCard"
import ResponsiveGrid from "../components/ResponsiveGrid"
import helpDirectoryService from "../services/helpDirectoryService"

const { width: screenWidth } = Dimensions.get("window")
const isTablet = screenWidth > 768

export default function HelpDirectoryScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const [resources, setResources] = useState([])
  const [categories, setCategories] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [nearbyResources, setNearbyResources] = useState([])
  const [showNearby, setShowNearby] = useState(false)

  useEffect(() => {
    initializeScreen()
  }, [])

  const initializeScreen = async () => {
    setLoading(true)
    await Promise.all([loadCategories(), loadResources(), loadEmergencyResources()])
    setLoading(false)
  }

  const loadCategories = async () => {
    try {
      const result = await helpDirectoryService.getCategories()
      if (result.success) {
        setCategories(result.categories)
      }
    } catch (error) {
      console.error("Error loading categories:", error)
    }
  }

  const loadResources = async () => {
    try {
      const filters = selectedCategory ? { category: selectedCategory } : {}
      const result = await helpDirectoryService.getHelpResources(filters)

      if (result.success) {
        setResources(result.resources)
      } else {
        Alert.alert("Error", result.message)
      }
    } catch (error) {
      console.error("Error loading resources:", error)
    }
  }

  const loadEmergencyResources = async () => {
    try {
      const result = await helpDirectoryService.getEmergencyResources()
      if (result.success) {
        // Add emergency resources to the top of the list
        setResources((prev) => [
          ...result.resources.map((r) => ({ ...r, isEmergency: true })),
          ...prev.filter((r) => !r.isEmergency),
        ])
      }
    } catch (error) {
      console.error("Error loading emergency resources:", error)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      await loadResources()
      return
    }

    setLoading(true)
    try {
      const filters = selectedCategory ? { category: selectedCategory } : {}
      const result = await helpDirectoryService.searchResources(searchQuery, filters)

      if (result.success) {
        setResources(result.resources)
        if (result.fromCache) {
          Alert.alert("Offline Mode", result.message)
        }
      } else {
        Alert.alert("Search Error", result.message)
      }
    } catch (error) {
      console.error("Error searching resources:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCategorySelect = async (categoryId) => {
    setSelectedCategory(categoryId === selectedCategory ? null : categoryId)
    setLoading(true)

    try {
      const filters = categoryId && categoryId !== selectedCategory ? { category: categoryId } : {}
      const result = await helpDirectoryService.getHelpResources(filters)

      if (result.success) {
        setResources(result.resources)
      }
    } catch (error) {
      console.error("Error filtering by category:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleFindNearby = async () => {
    setLoading(true)
    try {
      const result = await helpDirectoryService.getNearbyResources(25)

      if (result.success) {
        setNearbyResources(result.resources)
        setShowNearby(true)
        Alert.alert(
          "Nearby Resources Found",
          `Found ${result.resources.length} resources within 25km of your location.`,
        )
      } else {
        Alert.alert("Location Error", result.message)
      }
    } catch (error) {
      console.error("Error finding nearby resources:", error)
      Alert.alert("Error", "Failed to find nearby resources")
    } finally {
      setLoading(false)
    }
  }

  const handleContactResource = async (resource, method) => {
    try {
      // Track the contact
      await helpDirectoryService.contactResource(resource.id, method)

      if (method === "phone" && resource.phone) {
        const phoneUrl = `tel:${resource.phone}`
        const canOpen = await Linking.canOpenURL(phoneUrl)

        if (canOpen) {
          await Linking.openURL(phoneUrl)
        } else {
          Alert.alert("Error", "Cannot make phone calls on this device")
        }
      } else if (method === "website" && resource.website) {
        const canOpen = await Linking.canOpenURL(resource.website)

        if (canOpen) {
          await Linking.openURL(resource.website)
        } else {
          Alert.alert("Error", "Cannot open website")
        }
      } else if (method === "email" && resource.email) {
        const emailUrl = `mailto:${resource.email}`
        const canOpen = await Linking.canOpenURL(emailUrl)

        if (canOpen) {
          await Linking.openURL(emailUrl)
        } else {
          Alert.alert("Error", "Cannot send email on this device")
        }
      }
    } catch (error) {
      console.error("Error contacting resource:", error)
      Alert.alert("Error", "Failed to contact resource")
    }
  }

  const renderResourceCard = (resource) => (
    <ResponsiveCard key={resource.id} style={[styles.resourceCard, resource.isEmergency && styles.emergencyCard]}>
      <View style={styles.resourceHeader}>
        <View style={styles.resourceInfo}>
          <Text style={[styles.resourceName, resource.isEmergency && styles.emergencyText]}>{resource.name}</Text>
          {resource.isEmergency && (
            <View style={styles.emergencyBadge}>
              <Ionicons name="alert-circle" size={12} color="#dc2626" />
              <Text style={styles.emergencyBadgeText}>Emergency</Text>
            </View>
          )}
          <Text style={styles.resourceType}>{resource.type || resource.category}</Text>
          {resource.distance && <Text style={styles.resourceDistance}>{resource.distance.toFixed(1)} km away</Text>}
        </View>
        <View style={styles.availabilityBadge}>
          <Text style={styles.availabilityText}>{resource.availability || "24/7"}</Text>
        </View>
      </View>

      <Text style={styles.resourceDescription} numberOfLines={3}>
        {resource.description}
      </Text>

      {resource.services && resource.services.length > 0 && (
        <View style={styles.servicesContainer}>
          <Text style={styles.servicesTitle}>Services:</Text>
          <Text style={styles.servicesText}>{resource.services.join(", ")}</Text>
        </View>
      )}

      <View style={styles.contactButtons}>
        {resource.phone && (
          <TouchableOpacity
            style={[styles.contactButton, styles.phoneButton]}
            onPress={() => handleContactResource(resource, "phone")}
            activeOpacity={0.7}
          >
            <Ionicons name="call" size={16} color="#ffffff" />
            <Text style={styles.contactButtonText}>Call</Text>
          </TouchableOpacity>
        )}

        {resource.website && (
          <TouchableOpacity
            style={[styles.contactButton, styles.websiteButton]}
            onPress={() => handleContactResource(resource, "website")}
            activeOpacity={0.7}
          >
            <Ionicons name="globe" size={16} color="#ffffff" />
            <Text style={styles.contactButtonText}>Website</Text>
          </TouchableOpacity>
        )}

        {resource.email && (
          <TouchableOpacity
            style={[styles.contactButton, styles.emailButton]}
            onPress={() => handleContactResource(resource, "email")}
            activeOpacity={0.7}
          >
            <Ionicons name="mail" size={16} color="#ffffff" />
            <Text style={styles.contactButtonText}>Email</Text>
          </TouchableOpacity>
        )}
      </View>

      {resource.address && (
        <View style={styles.addressContainer}>
          <Ionicons name="location-outline" size={14} color="#6b7280" />
          <Text style={styles.addressText}>{resource.address}</Text>
        </View>
      )}
    </ResponsiveCard>
  )

  const displayResources = showNearby ? nearbyResources : resources

  return (
    <SafeAreaWrapper backgroundColor="#f0f9ff" statusBarStyle="dark-content">
      <LinearGradient colors={["#f0f9ff", "#e0f2fe"]} style={styles.gradient}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: 10 }]}>
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={22} color="#64748b" />
            </TouchableOpacity>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Help Directory</Text>
              <Text style={styles.headerSubtitle}>
                {showNearby ? "Nearby Resources" : "Professional Support & Resources"}
              </Text>
            </View>
            <TouchableOpacity style={styles.locationButton} onPress={handleFindNearby} activeOpacity={0.7}>
              <Ionicons name="location" size={20} color="#3b82f6" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#6b7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search resources, services, or locations..."
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery("")
                  loadResources()
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle" size={20} color="#6b7280" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 100, 120) }]}
        >
          {/* Categories */}
          {!showNearby && categories.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Categories</Text>
              <ResponsiveGrid columns={isTablet ? 3 : 2} spacing={12}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[styles.categoryCard, selectedCategory === category.id && styles.categoryCardSelected]}
                    onPress={() => handleCategorySelect(category.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={category.icon}
                      size={24}
                      color={selectedCategory === category.id ? "#3b82f6" : "#6b7280"}
                    />
                    <Text
                      style={[styles.categoryName, selectedCategory === category.id && styles.categoryNameSelected]}
                    >
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ResponsiveGrid>
            </View>
          )}

          {/* Toggle View Button */}
          {nearbyResources.length > 0 && (
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[styles.toggleButton, !showNearby && styles.toggleButtonActive]}
                onPress={() => setShowNearby(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.toggleButtonText, !showNearby && styles.toggleButtonTextActive]}>
                  All Resources
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleButton, showNearby && styles.toggleButtonActive]}
                onPress={() => setShowNearby(true)}
                activeOpacity={0.7}
              >
                <Text style={[styles.toggleButtonText, showNearby && styles.toggleButtonTextActive]}>
                  Nearby ({nearbyResources.length})
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Resources List */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{showNearby ? "Nearby Resources" : "Available Resources"}</Text>
              <Text style={styles.resourceCount}>{displayResources.length} found</Text>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text style={styles.loadingText}>Loading resources...</Text>
              </View>
            ) : displayResources.length === 0 ? (
              <ResponsiveCard style={styles.emptyState}>
                <Ionicons name="search-outline" size={48} color="#9ca3af" />
                <Text style={styles.emptyTitle}>No Resources Found</Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery
                    ? "Try adjusting your search terms or filters"
                    : "No resources available for the selected criteria"}
                </Text>
                {searchQuery && (
                  <TouchableOpacity
                    style={styles.clearSearchButton}
                    onPress={() => {
                      setSearchQuery("")
                      loadResources()
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.clearSearchButtonText}>Clear Search</Text>
                  </TouchableOpacity>
                )}
              </ResponsiveCard>
            ) : (
              <View style={styles.resourcesList}>{displayResources.map(renderResourceCard)}</View>
            )}
          </View>

          {/* Emergency Notice */}
          <ResponsiveCard backgroundColor="rgba(254, 242, 242, 0.9)" style={styles.emergencyNotice}>
            <View style={styles.emergencyNoticeHeader}>
              <Ionicons name="alert-circle" size={20} color="#dc2626" />
              <Text style={styles.emergencyNoticeTitle}>Emergency Situations</Text>
            </View>
            <Text style={styles.emergencyNoticeText}>
              If you're in immediate danger or having thoughts of self-harm, please contact emergency services (14416) or
              a crisis hotline immediately.
            </Text>
            <TouchableOpacity
              style={styles.emergencyButton}
              onPress={() => Linking.openURL("tel:14416")}
              activeOpacity={0.7}
            >
              <Text style={styles.emergencyButtonText}>Call 14416</Text>
            </TouchableOpacity>
          </ResponsiveCard>
        </ScrollView>
      </LinearGradient>
    </SafeAreaWrapper>
  )
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: isTablet ? 28 : 24,
    fontWeight: "700",
    color: "#374151",
  },
  headerSubtitle: {
    fontSize: isTablet ? 18 : 16,
    color: "#6b7280",
    marginTop: 4,
  },
  locationButton: {
    width: 44,
    height: 44,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: isTablet ? 18 : 16,
    color: "#374151",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: isTablet ? 22 : 20,
    fontWeight: "600",
    color: "#374151",
  },
  resourceCount: {
    fontSize: isTablet ? 16 : 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  categoryCard: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 12,
    padding: isTablet ? 20 : 16,
    alignItems: "center",
    gap: 8,
    borderWidth: 2,
    borderColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryCardSelected: {
    borderColor: "#3b82f6",
    backgroundColor: "rgba(59, 130, 246, 0.1)",
  },
  categoryName: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: "500",
    color: "#6b7280",
    textAlign: "center",
  },
  categoryNameSelected: {
    color: "#3b82f6",
    fontWeight: "600",
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  toggleButtonActive: {
    backgroundColor: "#3b82f6",
  },
  toggleButtonText: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: "500",
    color: "#6b7280",
  },
  toggleButtonTextActive: {
    color: "#ffffff",
    fontWeight: "600",
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: isTablet ? 18 : 16,
    color: "#6b7280",
    marginTop: 12,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: isTablet ? 22 : 20,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: isTablet ? 16 : 14,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 20,
  },
  clearSearchButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  clearSearchButtonText: {
    color: "#ffffff",
    fontSize: isTablet ? 16 : 14,
    fontWeight: "600",
  },
  resourcesList: {
    gap: 16,
  },
  resourceCard: {
    padding: isTablet ? 20 : 16,
  },
  emergencyCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#dc2626",
    backgroundColor: "rgba(254, 242, 242, 0.9)",
  },
  resourceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  resourceInfo: {
    flex: 1,
    marginRight: 12,
  },
  resourceName: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },
  emergencyText: {
    color: "#dc2626",
  },
  emergencyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  emergencyBadgeText: {
    fontSize: 12,
    color: "#dc2626",
    fontWeight: "600",
  },
  resourceType: {
    fontSize: isTablet ? 16 : 14,
    color: "#6b7280",
    fontWeight: "500",
    textTransform: "capitalize",
    marginBottom: 2,
  },
  resourceDistance: {
    fontSize: isTablet ? 14 : 12,
    color: "#059669",
    fontWeight: "500",
  },
  availabilityBadge: {
    backgroundColor: "#d1fae5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  availabilityText: {
    fontSize: isTablet ? 14 : 12,
    color: "#059669",
    fontWeight: "600",
  },
  resourceDescription: {
    fontSize: isTablet ? 16 : 14,
    color: "#374151",
    lineHeight: isTablet ? 24 : 20,
    marginBottom: 12,
  },
  servicesContainer: {
    marginBottom: 16,
  },
  servicesTitle: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },
  servicesText: {
    fontSize: isTablet ? 15 : 13,
    color: "#6b7280",
    lineHeight: 18,
  },
  contactButtons: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
    justifyContent: "center",
  },
  phoneButton: {
    backgroundColor: "#059669",
  },
  websiteButton: {
    backgroundColor: "#3b82f6",
  },
  emailButton: {
    backgroundColor: "#8b5cf6",
  },
  contactButtonText: {
    color: "#ffffff",
    fontSize: isTablet ? 14 : 12,
    fontWeight: "600",
  },
  addressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  addressText: {
    fontSize: isTablet ? 14 : 12,
    color: "#6b7280",
    flex: 1,
  },
  emergencyNotice: {
    marginTop: 20,
  },
  emergencyNoticeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  emergencyNoticeTitle: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: "600",
    color: "#dc2626",
  },
  emergencyNoticeText: {
    fontSize: isTablet ? 16 : 14,
    color: "#7f1d1d",
    lineHeight: 20,
    marginBottom: 16,
  },
  emergencyButton: {
    backgroundColor: "#dc2626",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  emergencyButtonText: {
    color: "#ffffff",
    fontSize: isTablet ? 16 : 14,
    fontWeight: "600",
  },
})
