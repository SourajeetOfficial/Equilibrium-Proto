// controllers/authController.js
const User = require('../models/User');
const Aggregate = require('../models/Aggregate');
const Alert = require('../models/Alert');
const jwt = require('jsonwebtoken');

// @desc    Register a new user
// @route   POST /api/v1/auth/register
exports.register = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User with this email already exists" });
    }

    // Create user with only the essential fields. Consent is handled separately.
    const user = await User.create({ email, password });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "30d" });

    // In the response, we only send back the non-sensitive ID
    res.status(201).json({
      token,
      userId: user._id, // The frontend will need this for subsequent requests
      pseudonymId: user.pseudonymId
    });
  } catch (error) {
    res.status(500).json({ message: "Server error during registration", error: error.message });
  }
};


// @desc    Login user
// @route   POST /api/v1/auth/login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "30d" });

        res.status(200).json({
            token,
            userId: user._id,
            pseudonymId: user.pseudonymId
        });
    } catch (error) {
        res.status(500).json({ message: "Server error during login", error: error.message });
    }
};

// @desc    Get user profile (consent flags, etc.)
// @route   GET /api/v1/auth/profile
exports.getProfile = async (req, res) => {
    // req.user is attached by the 'protect' middleware.
    // We explicitly fetch it again to control what is returned.
    try {
        const profile = await User.findById(req.user._id).select('email pseudonymId consentFlags');
        if (!profile) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(profile);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update user consent
// @route   PUT /api/v1/auth/consent

exports.updateConsent = async (req, res) => {
  try {
    // Get the flags from the request body. Only update the ones provided.
    const { usageTracking, cloudSync, emergencyContacts } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update flags if they are present in the request
    if (usageTracking !== undefined) {
      user.consentFlags.usageTracking = usageTracking;
    }
    if (cloudSync !== undefined) {
      user.consentFlags.cloudSync = cloudSync;
    }
    if (emergencyContacts !== undefined) {
      user.consentFlags.emergencyContacts = emergencyContacts;
    }

    await user.save();

    res.status(200).json({
      success: true,
      data: user.consentFlags,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Save user's Expo push token
// @route   POST /api/v1/auth/push-token
// @access  Private
exports.savePushToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Push token is required' });
    }

    const user = await User.findById(req.user._id);
    user.pushToken = token;
    await user.save();

    res.status(200).json({ success: true, message: 'Token saved successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Export all data for the logged-in user
// @route   GET /api/v1/auth/export
// @access  Private
exports.exportUserData = async (req, res) => {
  try {
    const userId = req.user._id;

    // Use Promise.all to fetch all data concurrently for efficiency
    const [profile, dailySummaries, wellnessAlerts] = await Promise.all([
      User.findById(userId).select('email pseudonymId consentFlags createdAt'),
      Aggregate.find({ user: userId }).sort({ date: 'asc' }),
      Alert.find({ user: userId }).sort({ createdAt: 'asc' })
    ]);

    // Construct the final export object
    const user_data = {
      profile,
      daily_summaries: dailySummaries,
      wellness_alerts: wellnessAlerts,
    };

    // Set headers to prompt a file download on the client
    res.setHeader('Content-Disposition', 'attachment; filename=equilibrium_data.json');
    res.setHeader('Content-Type', 'application/json');
    
    res.status(200).json(user_data);

  } catch (error) {
    console.error('Error exporting user data:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};



// @desc    Clear all generated data for a user (aggregates, alerts)
// @route   POST /api/v1/user/clear-data
// @access  Private
exports.clearUserData = async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.user._id;

    if (!password) {
      return res.status(400).json({ success: false, message: 'Password confirmation is required.' });
    }

    const user = await User.findById(userId).select('+password');
    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect password.' });
    }

    // If password is correct, delete data from related collections ONLY
    await Promise.all([
      Aggregate.deleteMany({ user: userId }),
      Alert.deleteMany({ user: userId }),
      // NOTE: We DO NOT delete the User document itself here
    ]);

    res.status(200).json({ success: true, message: 'All user-generated data has been cleared. Your account is still active.' });

  } catch (error) {
    console.error('Error clearing user data:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Delete a user account and all associated data
// @route   POST /api/v1/auth/delete
// @access  Private
exports.deleteUserAccount = async (req, res) => {
  try {
    // 1. Safely access the password from the request body
    const password = req.body?.password;
    const userId = req.user._id;

    // 2. Now this check works correctly even if the body is missing
    if (!password) {
      return res.status(400).json({ success: false, message: 'Password confirmation is required.' });
    }

    // ... rest of the function is the same ...
    const user = await User.findById(userId).select('+password');
    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect password.' });
    }

    await Promise.all([
      Aggregate.deleteMany({ user: userId }),
      Alert.deleteMany({ user: userId }),
      User.findByIdAndDelete(userId)
    ]);
    
    res.status(200).json({ success: true, message: 'User account and all data permanently deleted.' });

  } catch (error) {
    console.error('Error deleting user account:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};