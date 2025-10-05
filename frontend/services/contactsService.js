import api from "../config/api"
import AsyncStorage from "@react-native-async-storage/async-storage"

class ContactsService {
  // Add emergency contact (synced to backend)
  async addEmergencyContact(contactData) {
    try {
      const response = await api.post("/contacts/emergency", {
        name: contactData.name,
        phone: contactData.phone,
        email: contactData.email,
        relationship: contactData.relationship,
        isPrimary: contactData.isPrimary || false,
      })
      return { success: true, contact: response.data }
    } catch (error) {
      console.error("Add emergency contact error:", error)
      return {
        success: false,
        message: error.response?.data?.message || "Failed to add emergency contact",
      }
    }
  }

  // Get emergency contacts
  async getEmergencyContacts() {
    try {
      const response = await api.get("/contacts/emergency")
      return { success: true, contacts: response.data.contacts || response.data }
    } catch (error) {
      console.error("Get emergency contacts error:", error)
      return {
        success: false,
        message: error.response?.data?.message || "Failed to fetch emergency contacts",
      }
    }
  }

  // Update emergency contact
  async updateEmergencyContact(contactId, contactData) {
    try {
      const response = await api.put(`/contacts/emergency/${contactId}`, {
        name: contactData.name,
        phone: contactData.phone,
        email: contactData.email,
        relationship: contactData.relationship,
        isPrimary: contactData.isPrimary,
      })
      return { success: true, contact: response.data }
    } catch (error) {
      console.error("Update emergency contact error:", error)
      return {
        success: false,
        message: error.response?.data?.message || "Failed to update emergency contact",
      }
    }
  }

  // Delete emergency contact
  async deleteEmergencyContact(contactId) {
    try {
      await api.delete(`/contacts/emergency/${contactId}`)
      return { success: true }
    } catch (error) {
      console.error("Delete emergency contact error:", error)
      return {
        success: false,
        message: error.response?.data?.message || "Failed to delete emergency contact",
      }
    }
  }

  // Add close contact (local only - privacy first)
  async addCloseContact(contactData) {
    try {
      const existingContacts = await AsyncStorage.getItem("closeContacts")
      const contacts = existingContacts ? JSON.parse(existingContacts) : []

      const newContact = {
        id: Date.now().toString(),
        name: contactData.name,
        phone: contactData.phone,
        email: contactData.email,
        relationship: contactData.relationship,
        notes: contactData.notes || "",
        createdAt: new Date().toISOString(),
      }

      contacts.push(newContact)
      await AsyncStorage.setItem("closeContacts", JSON.stringify(contacts))

      return { success: true, contact: newContact }
    } catch (error) {
      console.error("Add close contact error:", error)
      return { success: false, message: "Failed to add close contact" }
    }
  }

  // Get close contacts (local only)
  async getCloseContacts() {
    try {
      const data = await AsyncStorage.getItem("closeContacts")
      const contacts = data ? JSON.parse(data) : []
      return { success: true, contacts }
    } catch (error) {
      console.error("Get close contacts error:", error)
      return { success: false, message: "Failed to fetch close contacts" }
    }
  }

  // Update close contact (local only)
  async updateCloseContact(contactId, contactData) {
    try {
      const data = await AsyncStorage.getItem("closeContacts")
      const contacts = data ? JSON.parse(data) : []

      const updatedContacts = contacts.map((contact) =>
        contact.id === contactId
          ? {
              ...contact,
              ...contactData,
              updatedAt: new Date().toISOString(),
            }
          : contact,
      )

      await AsyncStorage.setItem("closeContacts", JSON.stringify(updatedContacts))
      const updatedContact = updatedContacts.find((contact) => contact.id === contactId)

      return { success: true, contact: updatedContact }
    } catch (error) {
      console.error("Update close contact error:", error)
      return { success: false, message: "Failed to update close contact" }
    }
  }

  // Delete close contact (local only)
  async deleteCloseContact(contactId) {
    try {
      const data = await AsyncStorage.getItem("closeContacts")
      const contacts = data ? JSON.parse(data) : []

      const filteredContacts = contacts.filter((contact) => contact.id !== contactId)
      await AsyncStorage.setItem("closeContacts", JSON.stringify(filteredContacts))

      return { success: true }
    } catch (error) {
      console.error("Delete close contact error:", error)
      return { success: false, message: "Failed to delete close contact" }
    }
  }
}

export default new ContactsService()
