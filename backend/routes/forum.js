// routes/forum.js
const express = require('express');
const router = express.Router();
// 1. Import the new functions
const { 
    createPost, 
    getAllPosts,
    getPostWithComments,
    addComment 
} = require('../controllers/forumController');
const { protect } = require('../middleware/authMiddleware');

// All forum routes require a user to be logged in
router.use(protect);

router.route('/posts')
    .post(createPost)
    .get(getAllPosts);

// 2. Add routes for a single post and its comments
router.route('/posts/:postId')
    .get(getPostWithComments);

router.route('/posts/:postId/comments')
    .post(addComment);

module.exports = router;