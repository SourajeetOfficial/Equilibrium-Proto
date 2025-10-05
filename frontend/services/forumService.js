import api from "../config/api"

class ForumService {
  // Create a new post
  async createPost(postData) {
    try {
      const response = await api.post("/forum/posts", {
        title: postData.title,
        content: postData.content,
        category: postData.category || "general",
        isAnonymous: true, // Always anonymous for privacy
      })
      return { success: true, post: response.data }
    } catch (error) {
      console.error("Create post error:", error)
      return {
        success: false,
        message: error.response?.data?.message || "Failed to create post",
      }
    }
  }

  // Get all posts with pagination
  async getAllPosts(page = 1, limit = 20) {
    try {
      const response = await api.get(`/forum/posts?page=${page}&limit=${limit}`)
      return { success: true, posts: response.data.posts || response.data }
    } catch (error) {
      console.error("Get posts error:", error)
      return {
        success: false,
        message: error.response?.data?.message || "Failed to fetch posts",
      }
    }
  }

  // Get single post with comments
  async getPostWithComments(postId) {
    try {
      const response = await api.get(`/forum/posts/${postId}`)
      return { success: true, post: response.data }
    } catch (error) {
      console.error("Get post error:", error)
      return {
        success: false,
        message: error.response?.data?.message || "Failed to fetch post",
      }
    }
  }

  // Add comment to post
  async addComment(postId, commentData) {
    try {
      const response = await api.post(`/forum/posts/${postId}/comments`, {
        content: commentData.content,
        isAnonymous: true, // Always anonymous for privacy
      })
      return { success: true, comment: response.data }
    } catch (error) {
      console.error("Add comment error:", error)
      return {
        success: false,
        message: error.response?.data?.message || "Failed to add comment",
      }
    }
  }

  // Like/unlike a post
  async toggleLike(postId) {
    try {
      const response = await api.post(`/forum/posts/${postId}/like`)
      return { success: true, data: response.data }
    } catch (error) {
      console.error("Toggle like error:", error)
      return {
        success: false,
        message: error.response?.data?.message || "Failed to toggle like",
      }
    }
  }

  // Report a post
  async reportPost(postId, reason) {
    try {
      const response = await api.post(`/forum/posts/${postId}/report`, {
        reason: reason,
      })
      return { success: true, data: response.data }
    } catch (error) {
      console.error("Report post error:", error)
      return {
        success: false,
        message: error.response?.data?.message || "Failed to report post",
      }
    }
  }
}

export default new ForumService()