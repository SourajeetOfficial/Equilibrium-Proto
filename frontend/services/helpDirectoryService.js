// HelpDirectoryService.js

import api from "../config/api"
import localStorageService from "./localStorageService"
import * as Location from "expo-location"

class HelpDirectoryService {
  constructor() {
    this.cachedResources = null
    this.lastFetch = null
    this.cacheTimeout = 30 * 60 * 1000 // 30 minutes
    this.defaultCategories = [
      { id: "crisis", name: "Crisis Support", icon: "alert-circle" },
      { id: "therapy", name: "Therapy & Counseling", icon: "heart" },
      { id: "support_groups", name: "Support Groups", icon: "people" },
      { id: "medical", name: "Medical Services", icon: "medical" },
      { id: "emergency", name: "Emergency Services", icon: "call" },
      { id: "online", name: "Online Resources", icon: "globe" },
    ];
    this.emergencyFallback = [
      {
        id: "crisis_text_line",
        name: "Crisis Text Line",
        phone: "741741",
        description: "Free, 24/7 crisis support via text",
        availability: "24/7",
        type: "crisis",
        contactMethods: ["text"],
        isEmergency: true,
      },
      {
        id: "national_suicide_prevention",
        name: "National Suicide Prevention Lifeline",
        phone: "988",
        description: "Free and confidential emotional support",
        availability: "24/7",
        type: "crisis",
        contactMethods: ["phone", "chat"],
        isEmergency: true,
      },
      {
        id: "emergency_services",
        name: "Emergency Services",
        phone: "911",
        description: "Immediate emergency assistance",
        availability: "24/7",
        type: "emergency",
        contactMethods: ["phone"],
        isEmergency: true,
      },
    ];
  }

  async _fetchAndCacheAllResources() {
    try {
      const response = await api.get("/help-directory");
      const resources = response.data.data;

      // Add fallback emergency resources
      const allResources = [...this.emergencyFallback, ...resources];

      // Cache the results
      this.cachedResources = allResources;
      this.lastFetch = Date.now();

      // Also cache locally for offline access
      await localStorageService.setItem("cached_help_resources", {
        resources: allResources,
        timestamp: this.lastFetch,
      });

      return allResources;
    } catch (error) {
      console.error("Get help resources error:", error);

      const localCache = await localStorageService.getItem("cached_help_resources");
      if (localCache && localCache.resources) {
        return localCache.resources;
      }
      return this.emergencyFallback;
    }
  }

  async getHelpResources(filters = {}) {
    const allResources = await this._fetchAndCacheAllResources();
    const filteredResources = this._filterResources(allResources, filters);
    return { success: true, resources: filteredResources };
  }

  async getEmergencyResources() {
    const allResources = await this._fetchAndCacheAllResources();
    const emergencyResources = allResources.filter(r => r.isEmergency);
    return { success: true, resources: emergencyResources };
  }

  async getNearbyResources(radius = 25) {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        return { success: false, message: "Location permission is required." };
      }
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = location.coords;

      const allResources = await this._fetchAndCacheAllResources();
      const nearbyResources = allResources
        .filter(resource => resource.location && resource.location.coordinates)
        .map(resource => ({
          ...resource,
          distance: this.calculateDistance(
            latitude,
            longitude,
            resource.location.coordinates[1], // Latitude
            resource.location.coordinates[0] // Longitude
          ),
        }))
        .filter(resource => resource.distance <= radius)
        .sort((a, b) => a.distance - b.distance);

      return { success: true, resources: nearbyResources, userLocation: { latitude, longitude } };
    } catch (error) {
      console.error("Get nearby resources error:", error);
      return { success: false, message: "Failed to fetch nearby resources" };
    }
  }

  async getCategories() {
    return { success: true, categories: this.defaultCategories };
  }

  async searchResources(keyword, filters = {}) {
    const allResources = await this._fetchAndCacheAllResources();
    const filteredAndSearched = allResources.filter(resource => {
      const matchesKeyword =
        resource.name?.toLowerCase().includes(keyword.toLowerCase()) ||
        resource.description?.toLowerCase().includes(keyword.toLowerCase());
      const matchesCategory = !filters.category || resource.type === filters.category;
      return matchesKeyword && matchesCategory;
    });
    return { success: true, resources: filteredAndSearched };
  }

  _filterResources(resources, filters) {
    return resources.filter(resource => {
      const matchesCategory = !filters.category || resource.type === filters.category;
      return matchesCategory;
    });
  }

  // Calculate distance between two coordinates (Haversine formula)
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371 // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1)
    const dLon = this.toRadians(lon2 - lon1)

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c // Distance in kilometers
  }

  // Convert degrees to radians
  toRadians(degrees) {
    return degrees * (Math.PI / 180)
  }

  // Get resource by ID with caching
  async getResourceById(resourceId) {
    try {
      // Check local cache first
      const cacheKey = `resource_${resourceId}`
      const cached = await localStorageService.getItem(cacheKey)

      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return { success: true, resource: cached.resource, fromCache: true }
      }

      const response = await api.get(`/help-directory/${resourceId}`)
      const resource = response.data

      // Cache the resource
      await localStorageService.setItem(cacheKey, {
        resource,
        timestamp: Date.now(),
      })

      return { success: true, resource }
    } catch (error) {
      console.error("Get resource error:", error)

      // Try cache if network fails
      const cacheKey = `resource_${resourceId}`
      const cached = await localStorageService.getItem(cacheKey)
      if (cached) {
        return {
          success: true,
          resource: cached.resource,
          fromCache: true,
          message: "Showing cached data (offline mode)",
        }
      }

      return {
        success: false,
        message: error.response?.data?.message || "Failed to fetch resource",
      }
    }
  }

  // Search resources by keyword with intelligent filtering
  async searchResources(keyword, filters = {}) {
    try {
      const queryParams = new URLSearchParams()
      queryParams.append("search", keyword)

      // Add additional filters
      if (filters.category) queryParams.append("category", filters.category)
      if (filters.location) queryParams.append("location", filters.location)
      if (filters.type) queryParams.append("type", filters.type)
      if (filters.language) queryParams.append("language", filters.language)

      const response = await api.get(`/help-directory/search?${queryParams.toString()}`)
      const resources = response.data.resources || response.data

      // If no results from server, try local search in cached data
      if (resources.length === 0) {
        const localResults = await this.searchLocalCache(keyword, filters)
        if (localResults.length > 0) {
          return {
            success: true,
            resources: localResults,
            fromCache: true,
            message: "Showing cached search results",
          }
        }
      }

      return { success: true, resources }
    } catch (error) {
      console.error("Search resources error:", error)

      // Fallback to local search
      const localResults = await this.searchLocalCache(keyword, filters)
      return {
        success: localResults.length > 0,
        resources: localResults,
        fromCache: true,
        message:
          localResults.length > 0 ? "Showing cached search results (offline mode)" : "Failed to search resources",
      }
    }
  }

  // Search in local cache
  async searchLocalCache(keyword, filters = {}) {
    try {
      const cached = await localStorageService.getItem("cached_help_resources")
      if (!cached || !cached.resources) return []

      const lowerKeyword = keyword.toLowerCase()

      return cached.resources.filter((resource) => {
        // Text search
        const matchesKeyword =
          resource.name?.toLowerCase().includes(lowerKeyword) ||
          resource.description?.toLowerCase().includes(lowerKeyword) ||
          resource.services?.some((service) => service.toLowerCase().includes(lowerKeyword)) ||
          resource.specialties?.some((specialty) => specialty.toLowerCase().includes(lowerKeyword))

        // Filter matching
        const matchesCategory = !filters.category || resource.category === filters.category
        const matchesType = !filters.type || resource.type === filters.type
        const matchesLocation =
          !filters.location || resource.address?.toLowerCase().includes(filters.location.toLowerCase())

        return matchesKeyword && matchesCategory && matchesType && matchesLocation
      })
    } catch (error) {
      console.error("Error searching local cache:", error)
      return []
    }
  }

  // Get resource categories
  async getCategories() {
    try {
      const response = await api.get("/help-directory/categories")
      return { success: true, categories: response.data }
    } catch (error) {
      console.error("Error getting categories:", error)

      // Return default categories if API fails
      const defaultCategories = [
        { id: "crisis", name: "Crisis Support", icon: "alert-circle" },
        { id: "therapy", name: "Therapy & Counseling", icon: "heart" },
        { id: "support_groups", name: "Support Groups", icon: "people" },
        { id: "medical", name: "Medical Services", icon: "medical" },
        { id: "emergency", name: "Emergency Services", icon: "call" },
        { id: "online", name: "Online Resources", icon: "globe" },
      ]

      return { success: true, categories: defaultCategories, fromDefault: true }
    }
  }

  // Contact a resource (track usage for analytics)
  async contactResource(resourceId, contactMethod) {
    try {
      // Log the contact attempt (anonymized)
      await api.post("/help-directory/contact", {
        resourceId,
        contactMethod,
        timestamp: new Date().toISOString(),
      })

      // Update local usage stats
      const usageKey = "help_directory_usage"
      const usage = (await localStorageService.getItem(usageKey)) || {}

      if (!usage[resourceId]) {
        usage[resourceId] = { contacts: 0, lastContact: null }
      }

      usage[resourceId].contacts++
      usage[resourceId].lastContact = new Date().toISOString()

      await localStorageService.setItem(usageKey, usage)

      return { success: true }
    } catch (error) {
      console.error("Error tracking resource contact:", error)
      // Don't fail the contact attempt if tracking fails
      return { success: true, trackingFailed: true }
    }
  }

  // Get emergency resources (always prioritized)
  async getEmergencyResources() {
    try {
      const response = await api.get("/help-directory/emergency")
      return { success: true, resources: response.data.resources || response.data }
    } catch (error) {
      console.error("Error getting emergency resources:", error)

      // Return hardcoded emergency resources as fallback
      const emergencyFallback = [
        {
          id: "crisis_text_line",
          name: "Crisis Text Line",
          phone: "741741",
          description: "Free, 24/7 crisis support via text",
          availability: "24/7",
          type: "crisis",
          contactMethods: ["text"],
        },
        {
          id: "national_suicide_prevention",
          name: "National Suicide Prevention Lifeline",
          phone: "988",
          description: "Free and confidential emotional support",
          availability: "24/7",
          type: "crisis",
          contactMethods: ["phone", "chat"],
        },
        {
          id: "emergency_services",
          name: "Emergency Services",
          phone: "911",
          description: "Immediate emergency assistance",
          availability: "24/7",
          type: "emergency",
          contactMethods: ["phone"],
        },
      ]

      return {
        success: true,
        resources: emergencyFallback,
        fromFallback: true,
        message: "Showing emergency fallback resources",
      }
    }
  }

  // Clear cache
  async clearCache() {
    try {
      this.cachedResources = null
      this.lastFetch = null
      await localStorageService.removeItem("cached_help_resources")
      return true
    } catch (error) {
      console.error("Error clearing cache:", error)
      return false
    }
  }
}

export default new HelpDirectoryService()
