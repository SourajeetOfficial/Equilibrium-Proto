// routes/auth.js
const express = require('express');
const router = express.Router();
const { register, login,verifyEmail, getProfile,updateProfile, updateConsent, savePushToken,exportUserData,deleteUserAccount,clearUserData,logout,forgotPassword,resetPassword,changePassword} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes (require a valid token)
router.route('/profile').get(protect, getProfile)
                        .put(protect, updateProfile);
router.post('/consent', protect, updateConsent);
router.post('/push-token',protect,savePushToken);
router.get('/export', protect, exportUserData);
router.post('/clear-data', protect, clearUserData);
router.post('/delete', protect, deleteUserAccount);
router.post('/logout', protect, logout);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);
router.post('/changepassword', protect, changePassword)
router.get('/verifyemail/:token', verifyEmail);

module.exports = router;