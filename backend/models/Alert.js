// models/Alert.js
const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    pseudonymId: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['wellness_drop', 'crisis_level'], // We start with a general wellness drop type
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    primaryCause: {
      type: String,
      enum: ['Sleep', 'Mood', 'Digital Wellbeing', 'Activity'], // To know which pillar caused the alert
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Alert', AlertSchema);