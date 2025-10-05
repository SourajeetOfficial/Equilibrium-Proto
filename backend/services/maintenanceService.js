// services/maintenanceService.js
const User = require('../models/User');

/**
 * Finds and deletes user accounts that were created more than 24 hours ago
 * but have not been verified via email.
 */
const cleanupUnverifiedUsers = async () => {
  console.log('Running daily cleanup job for unverified users...');
  try {
    // 1. Calculate the date for 24 hours ago
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // 2. Find all users who are not verified AND were created before this time
    const result = await User.deleteMany({
      isVerified: false,
      createdAt: { $lt: twentyFourHoursAgo } // $lt means "less than"
    });

    if (result.deletedCount > 0) {
      console.log(`Cleanup successful. Deleted ${result.deletedCount} unverified user(s).`);
    } else {
      console.log('No unverified users to clean up.');
    }
  } catch (error) {
    console.error('Error during unverified user cleanup:', error);
  }
};

module.exports = { cleanupUnverifiedUsers };