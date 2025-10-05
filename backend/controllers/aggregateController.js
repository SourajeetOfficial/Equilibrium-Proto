const Aggregate = require('../models/Aggregate');

// @desc    Create or update a daily aggregate
// @route   POST /api/v1/aggregates
// @access  Private
exports.logAggregate = async (req, res) => {
  try {
    // Check if the user has consented to usage tracking
    if (!req.user.consentFlags.usageTracking) {
      return res.status(403).json({ 
        success: false, 
        message: 'User has not consented to usage tracking. Data was not saved.' 
      });
    }

    // Using snake_case for consistency with the model
    const { date, avg_sleep_hours, night_screen_minutes, sentiment_label } = req.body;
    const userId = req.user._id;

    const aggregateData = await Aggregate.findOneAndUpdate(
      { user: userId, date: new Date(date).setHours(0, 0, 0, 0) },
      {
        $set: {
          avg_sleep_hours,
          night_screen_minutes,
          sentiment_label,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    res.status(200).json({ success: true, data: aggregateData });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get all aggregates for a user (last 30 days)
// @route   GET /api/v1/aggregates
// @access  Private
exports.getAggregates = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const aggregates = await Aggregate.find({
      user: req.user._id,
      date: { $gte: thirtyDaysAgo }
    }).sort({ date: 'asc' });

    res.status(200).json({ success: true, count: aggregates.length, data: aggregates });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};