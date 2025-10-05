// controllers/authController.js
const User = require('../models/User');
const Aggregate = require('../models/Aggregate');
const Alert = require('../models/Alert');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');


// @desc    Register a new user and send verification email
// @route   POST /api/v1/auth/register
exports.register = async (req, res) => {
    try {
        const { email, password, username } = req.body;

        // --- 1. Validation ---
        if (!email || !password || !username) {
            return res.status(400).json({ message: "Email, password, and username are required" });
        }
        if (username.length < 3) {
            return res.status(400).json({ message: "Username must be at least 3 characters" });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }
        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            return res.status(400).json({ message: "This username is already taken" });
        }
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User with this email already exists" });
        }

        // --- 2. Create User (as unverified) ---
        const user = await User.create({ email, password, username });

        // --- 3. Generate and Save Verification Token ---
        const verificationToken = crypto.randomBytes(20).toString('hex');
        user.verificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
        await user.save({ validateBeforeSave: false }); // Save the token without running all validators again

        // --- 4. Send Verification Email ---
        const verificationUrl = `${req.protocol}://${req.get('host')}/api/v1/auth/verifyemail/${verificationToken}`;
        const message = `Thank you for registering with Equilibrium! Please click the following link to verify your email address and complete your registration:\n\n${verificationUrl}`;

        try {
            await sendEmail({
                email: user.email,
                subject: 'Equilibrium Account Verification',
                message
            });

            // --- 5. Send Final Response to User ---
            res.status(201).json({
                success: true,
                message: 'Registration successful. A verification email has been sent to your address.'
            });

        } catch (err) {
            // If the email fails to send, we should not keep the user in a broken state.
            // For a production app, we'd add more robust retry logic here.
            await User.deleteOne({ _id: user._id }); // Clean up the user if email fails
            return res.status(500).json({ success: false, message: 'Email could not be sent. Please try registering again.' });
        }

    } catch (error) {
        res.status(500).json({ message: "Server error during registration", error: error.message });
    }
};


// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        // --- THIS IS THE NEW, CRUCIAL CHECK ---
        if (!user.isVerified) {
            return res.status(401).json({ success: false, message: "Please verify your email address before logging in." });
        }
        // -----------------------------------------

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "30d" });

        res.status(200).json({
            success: true,
            token,
            userId: user._id,
            pseudonymId: user.pseudonymId
        });
    } catch (error) {
        res.status(500).json({ message: "Server error during login", error: error.message });
    }
};

// @desc    Get user profile (email, username, consent flags, etc.)
// @route   GET /api/v1/auth/profile
exports.getProfile = async (req, res) => {
    try {
        // We now also select the 'username' to display in the app's profile screen
        const profile = await User.findById(req.user._id).select('email pseudonymId username consentFlags');
        if (!profile) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(profile);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Update a user's profile (e.g., username)
// @route   PUT /api/v1/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
    try {
        const { username } = req.body;
        const user = await User.findById(req.user._id);

        if (username) {
            // Check if the new username is already taken by someone else
            const existingUsername = await User.findOne({ username });
            if (existingUsername && existingUsername._id.toString() !== user._id.toString()) {
                return res.status(400).json({ message: 'This username is already taken.' });
            }
            user.username = username;
        }

        const updatedUser = await user.save();
        res.status(200).json({
            success: true,
            username: updatedUser.username,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
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

// @desc    Log user out
// @route   POST /api/v1/auth/logout
// @access  Private
exports.logout = async (req, res) => {
    // In a stateless JWT system, the main logout logic is on the client (deleting the token).
    // This endpoint is here for good practice.
    res.status(200).json({ success: true, message: 'Logged out successfully.' });
};

// @desc    Forgot password
// @route   POST /api/v1/auth/forgotpassword
exports.forgotPassword = async (req, res) => {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        return res.status(404).json({ success: false, message: 'There is no user with that email.' });
    }

    // 1. Generate a random reset token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // 2. Hash token and set to user model
    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // Expires in 10 minutes

    await user.save();

    // 3. Create reset URL and send email
    const resetUrl = `${req.protocol}://${req.get('host')}/resetpassword/${resetToken}`;
    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

    try {
        await sendEmail({
            email: user.email,
            subject: 'Password Reset Token',
            message
        });
        res.status(200).json({ success: true, data: 'Email sent' });
    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();
        return res.status(500).json({ success: false, message: 'Email could not be sent' });
    }
};

// @desc    Reset password
// @route   PUT /api/v1/auth/resetpassword/:resettoken
exports.resetPassword = async (req, res) => {
    const resetToken = crypto.createHash('sha256').update(req.params.resettoken).digest('hex');
    const user = await User.findOne({
        passwordResetToken: resetToken,
        passwordResetExpires: { $gt: Date.now() } // $gt means "greater than"
    });

    if (!user) {
        return res.status(400).json({ success: false, message: 'Invalid or expired token.' });
    }

    // Set new password
    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // (Optional) Send a new JWT token for immediate login
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "30d" });
    res.status(200).json({ success: true, token });
};

// @desc    Change password for a logged-in user
// @route   POST /api/v1/auth/changepassword
// @access  Private
exports.changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Please provide both old and new passwords.' });
        }

        // 1. Get user from database, making sure to select the password field
        const user = await User.findById(req.user._id).select('+password');

        // 2. Check if the provided old password is correct
        const isMatch = await user.matchPassword(oldPassword);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Incorrect old password.' });
        }

        // 3. Set the new password and save. The pre-save hook will hash it automatically.
        user.password = newPassword;
        await user.save();

        res.status(200).json({ success: true, message: 'Password updated successfully.' });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Verify email
// @route   GET /api/v1/auth/verifyemail/:token
exports.verifyEmail = async (req, res) => {
    try {
        const verificationToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

        const user = await User.findOne({ verificationToken });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid verification token.' });
        }

        // Mark user as verified and clear the token
        user.isVerified = true;
        user.verificationToken = undefined;
        await user.save({ validateBeforeSave: false });

        // Send back a JWT token for immediate login
        // CORRECTED: Changed user._-id to user._id
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "30d" });
        
        res.status(200).json({ success: true, message: 'Email verified successfully.', token });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};