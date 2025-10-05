// models/ForumComment.js
const mongoose = require('mongoose');

const ForumCommentSchema = new mongoose.Schema({
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ForumPost',
        required: true,
    },
    pseudonymId: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: [true, 'Comment content cannot be empty.'],
        trim: true,
    },
}, { timestamps: true });

module.exports = mongoose.model('ForumComment', ForumCommentSchema);