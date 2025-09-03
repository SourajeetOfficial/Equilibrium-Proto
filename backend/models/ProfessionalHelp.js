// models/ProfessionalHelp.js
const mongoose = require('mongoose');

const ProfessionalHelpSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['Private', 'Government', 'NGO'],
  },
  // GeoJSON for storing location data, essential for "nearby" searches
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  },
  address: {
    type: String,
  },
  contactInfo: {
    type: String, // Can be a phone number, email, or website
    required: true,
  },
});

// Create a 2dsphere index for efficient geospatial queries
ProfessionalHelpSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('ProfessionalHelp', ProfessionalHelpSchema);