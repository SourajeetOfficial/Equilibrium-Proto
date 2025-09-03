// models/Aggregate.js
const mongoose = require('mongoose');

const AggregateSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    avg_sleep_hours: {
      type: Number,
      default: 0,
    },
    night_screen_minutes: {
      type: Number,
      default: 0,
    },
    sentiment_label: {
      type: String,
      enum: ['positive', 'neutral', 'negative', 'not_recorded'],
      default: 'not_recorded',
    },
  },
  {
    timestamps: true,
  }
);

// Ensure a user can only have one aggregate entry per day
AggregateSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Aggregate', AggregateSchema);