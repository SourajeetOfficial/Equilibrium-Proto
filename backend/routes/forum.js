// routes/forum.js
const express = require('express');
const router = express.Router();
const { 
    createPost, 
    getAllPosts,
    getPostWithComments,
    addComment 
} = require('../controllers/forumController');
const { protect } = require('../middleware/authMiddleware');

// --- PUBLIC ROUTES (for guests and logged-in users) ---
// Anyone can view all posts
router.get('/posts', getAllPosts);
// Anyone can view a single post with its comments
router.get('/posts/:postId', getPostWithComments);


// --- PRIVATE ROUTES (require a user to be logged in) ---
// You must be logged in to create a post
router.post('/posts', protect, createPost);
// You must be logged in to add a comment
router.post('/posts/:postId/comments', protect, addComment);

module.exports = router;