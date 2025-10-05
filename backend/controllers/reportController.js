const Aggregate = require('../models/Aggregate');

// @desc    Generate a report based on a time period
// @route   GET /api/v1/reports?period=weekly
// @access  Private
exports.getReport = async (req, res) => {
  try {
    const period = req.query.period || 'weekly';
    const userId = req.user._id;

    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    switch (period) {
      case 'monthly':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case 'yearly':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case 'weekly':
      default:
        startDate.setDate(startDate.getDate() - 7);
        break;
    }

    const aggregates = await Aggregate.find({
      user: userId,
      date: { $gte: startDate },
    });

    if (aggregates.length === 0) {
      return res.status(200).json({ success: true, message: 'No data found for the selected period.', data: {} });
    }

    // Process data into a summary report using snake_case
    const report = {
      period,
      period_start_date: startDate,
      period_end_date: new Date(),
      total_days_tracked: aggregates.length,
      average_sleep_hours: aggregates.reduce((sum, agg) => sum + agg.avg_sleep_hours, 0) / aggregates.length,
      average_night_screen_minutes: aggregates.reduce((sum, agg) => sum + agg.night_screen_minutes, 0) / aggregates.length,
      mood_distribution: aggregates.reduce((dist, agg) => {
        dist[agg.sentiment_label] = (dist[agg.sentiment_label] || 0) + 1;
        return dist;
      }, {}),
    };
    
    // Clean up final values
    report.average_sleep_hours = parseFloat(report.average_sleep_hours.toFixed(1));
    report.average_night_screen_minutes = Math.round(report.average_night_screen_minutes);

    res.status(200).json({ success: true, data: report });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};