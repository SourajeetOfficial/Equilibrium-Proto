// controllers/helpDirectoryController.js
const ProfessionalHelp = require('../models/ProfessionalHelp');

// @desc    Get all professional help resources
// @route   GET /api/v1/help-directory
// @access  Public
exports.getHelpResources = async (req, res) => {
  try {
    const resources = await ProfessionalHelp.find({});
    res.status(200).json({ success: true, count: resources.length, data: resources });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};