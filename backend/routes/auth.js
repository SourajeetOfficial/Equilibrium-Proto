// routes/auth.js
const express = require('express');
const router = express.Router();
const { register, login, getProfile, updateConsent, savePushToken,exportUserData,deleteUserAccount,clearUserData} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes (require a valid token)
router.get('/profile', protect, getProfile);
router.post('/consent', protect, updateConsent);
router.post('/push-token',protect,savePushToken);
router.get('/export', protect, exportUserData);
router.post('/clear-data', protect, clearUserData);
router.post('/delete', protect, deleteUserAccount);

module.exports = router;