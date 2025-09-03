// models/ForumPost.js
const mongoose = require('mongoose');

const ForumPostSchema = new mongoose.Schema({
    pseudonymId: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: [true, 'Post content cannot be empty.'],
        trim: true,
    },
    // We can add features like upvotes or comment counts later
}, { timestamps: true });

module.exports = mongoose.model('ForumPost', ForumPostSchema);