"use client"

import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
import { useState, useEffect } from "react"
import SafeAreaWrapper from "../components/SafeAreaWrapper"
import forumService from "../services/forumService"

export default function Community({ navigation }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadPosts()
  }, [])

  const loadPosts = async () => {
    try {
      setLoading(true)
      const result = await forumService.getAllPosts()
      if (result.success && Array.isArray(result.posts)) {
        setPosts(result.posts)
      } else {
        setPosts([]) // Ensure posts is always an array
      }
    } catch (error) {
      console.error("Error loading posts:", error)
      setPosts([]) // Ensure posts is always an array on error
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadPosts()
    setRefreshing(false)
  }

  const categories = [
    { icon: "chatbubble-outline", title: "Daily Check-ins", count: "42 active", color: "#3b82f6", bgColor: "#dbeafe" },
    { icon: "heart-outline", title: "Coping Tips", count: "28 active", color: "#8b5cf6", bgColor: "#ede9fe" },
  ]

  return (
    <SafeAreaWrapper backgroundColor="#dbeafe" statusBarStyle="dark-content">
      <View style={styles.statusBarBg} />
      <LinearGradient colors={["#d1fae5", "#a7f3d0"]} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={20} color="#64748b" />
            </TouchableOpacity>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Anonymous Community</Text>
              <Text style={styles.headerSubtitle}>Safe space for support & sharing</Text>
            </View>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="search-outline" size={20} color="#64748b" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />}
        >
          {/* Privacy Notice */}
          <View style={styles.privacyNotice}>
            <Ionicons name="shield-checkmark" size={16} color="#059669" />
            <Text style={styles.privacyText}>All posts are anonymous. Your identity is protected.</Text>
          </View>

          {/* Quick Actions */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.newPostButton}>
              <Ionicons name="add" size={16} color="#ffffff" />
              <Text style={styles.newPostText}>New Post</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.chatButton}>
              <Ionicons name="chatbubble-outline" size={16} color="#10b981" />
            </TouchableOpacity>
          </View>

          {/* Support Categories */}
          <View style={styles.categoriesGrid}>
            {categories.map((category, index) => (
              <View key={index} style={styles.categoryCard}>
                <View style={[styles.categoryIcon, { backgroundColor: category.bgColor }]}>
                  <Ionicons name={category.icon} size={20} color={category.color} />
                </View>
                <Text style={styles.categoryTitle}>{category.title}</Text>
                <Text style={styles.categoryCount}>{category.count}</Text>
              </View>
            ))}
          </View>

          {/* Recent Posts */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Posts</Text>
            <View style={styles.postsContainer}>
              {posts.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="people-outline" size={48} color="#9ca3af" />
                  <Text style={styles.emptyTitle}>No posts yet</Text>
                  <Text style={styles.emptySubtitle}>Be the first to share and start a conversation</Text>
                </View>
              ) : (
                posts.map((post) => (
                  <View key={post._id} style={styles.postCard}>
                    <View style={styles.postHeader}>
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>A</Text>
                      </View>
                      <View style={styles.postMeta}>
                        <View style={styles.postMetaRow}>
                          <Text style={styles.authorName}>Anonymous</Text>
                          <Text style={styles.postTime}>{new Date(post.createdAt).toLocaleDateString()}</Text>
                        </View>
                        <Text style={styles.postTitle}>{post.title}</Text>
                        <Text style={styles.postContent} numberOfLines={3}>
                          {post.content}
                        </Text>
                        <View style={styles.postActions}>
                          <View style={styles.postStats}>
                            <TouchableOpacity style={styles.statButton}>
                              <Ionicons name="heart-outline" size={12} color="#6b7280" />
                              <Text style={styles.statText}>{post.likes || 0}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.statButton}>
                              <Ionicons name="chatbubble-outline" size={12} color="#6b7280" />
                              <Text style={styles.statText}>{post.comments?.length || 0}</Text>
                            </TouchableOpacity>
                          </View>
                          <TouchableOpacity>
                            <Text style={styles.replyButton}>Reply</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </LinearGradient>
    </SafeAreaWrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statusBarBg: {
    height: 0,
    backgroundColor: "#d1fae5",
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
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#374151",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6b7280",
  },
  iconButton: {
    width: 40,
    height: 40,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  privacyNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderRadius: 8,
  },
  privacyText: {
    fontSize: 12,
    color: "#059669",
    fontWeight: "500",
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  newPostButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#10b981",
    paddingVertical: 12,
    borderRadius: 8,
  },
  newPostText: {
    fontSize: 16,
    color: "#ffffff",
    fontWeight: "500",
  },
  chatButton: {
    width: 48,
    height: 48,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#a7f3d0",
    justifyContent: "center",
    alignItems: "center",
  },
  categoriesGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  categoryCard: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 4,
    textAlign: "center",
  },
  categoryCount: {
    fontSize: 12,
    color: "#6b7280",
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 16,
  },
  postsContainer: {
    gap: 16,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "500",
    color: "#374151",
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
  postCard: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  postHeader: {
    flexDirection: "row",
    gap: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#d1fae5",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#10b981",
  },
  postMeta: {
    flex: 1,
  },
  postMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  authorName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  postTime: {
    fontSize: 12,
    color: "#9ca3af",
  },
  postTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  postContent: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
    marginBottom: 12,
  },
  postActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  postStats: {
    flexDirection: "row",
    gap: 16,
  },
  statButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: "#6b7280",
  },
  replyButton: {
    fontSize: 14,
    color: "#10b981",
    fontWeight: "500",
  },
})
