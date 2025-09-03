// controllers/forumController.js
const ForumPost = require('../models/ForumPost');
const ForumComment = require('../models/ForumComment');

// @desc    Create a new forum post
// @route   POST /api/v1/forum/posts
// @access  Private
exports.createPost = async (req, res) => {
    try {
        const { content } = req.body;
        // Use the pseudonymId from the authenticated user
        const pseudonymId = req.user.pseudonymId;

        const post = await ForumPost.create({
            content,
            pseudonymId,
        });

        res.status(201).json({ success: true, data: post });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Get all forum posts
// @route   GET /api/v1/forum/posts
// @access  Private
exports.getAllPosts = async (req, res) => {
    try {
        // Fetch latest posts first
        const posts = await ForumPost.find({}).sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: posts.length, data: posts });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get a single post with all its comments
// @route   GET /api/v1/forum/posts/:postId
// @access  Private
exports.getPostWithComments = async (req, res) => {
    try {
        const { postId } = req.params;

        // Fetch the post and its comments at the same time for efficiency
        const [post, comments] = await Promise.all([
            ForumPost.findById(postId),
            ForumComment.find({ postId }).sort({ createdAt: 'asc' })
        ]);

        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        res.status(200).json({ success: true, data: { post, comments } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Add a comment to a post
// @route   POST /api/v1/forum/posts/:postId/comments
// @access  Private
exports.addComment = async (req, res) => {
    try {
        const { postId } = req.params;
        const { content } = req.body;
        const pseudonymId = req.user.pseudonymId;

        // Check if the post exists before adding a comment
        const post = await ForumPost.findById(postId);
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        const comment = await ForumComment.create({
            postId,
            content,
            pseudonymId
        });

        res.status(201).json({ success: true, data: comment });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};