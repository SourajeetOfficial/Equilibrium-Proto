// controllers/alertController.js
const { Expo } = require('expo-server-sdk');
const User = require('../models/User');

const expo = new Expo();

// @desc    Trigger a push notification for a detected anomaly
// @route   POST /api/v1/alerts/trigger
// @access  Private
exports.triggerAlert = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    // The frontend can optionally send a custom message based on its analysis
    const { title, message } = req.body;

    const alertTitle = title || 'Equilibrium Check-in';
    const alertMessage = message || "We've noticed a change in your recent patterns. Take a moment to check in with yourself.";

    // Check if the user has a push token
    if (user.pushToken && Expo.isExpoPushToken(user.pushToken)) {
      const pushMessage = {
        to: user.pushToken,
        sound: 'default',
        title: alertTitle,
        body: alertMessage,
        data: { type: 'wellness_alert' }, // Data for the frontend to handle the notification
      };

      await expo.sendPushNotificationsAsync([pushMessage]);
      console.log(`Wellness Alert sent to user ${user.pseudonymId}`);
      res.status(200).json({ success: true, message: 'Alert sent successfully.' });
    } else {
      res.status(400).json({ success: false, message: 'User does not have a valid push token.' });
    }
  } catch (error) {
    console.error('Error triggering alert:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};