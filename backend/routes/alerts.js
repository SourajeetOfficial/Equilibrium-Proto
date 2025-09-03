// routes/alerts.js
const express = require('express');
const router = express.Router();
const { triggerAlert } = require('../controllers/alertController');
const { protect } = require('../middleware/authMiddleware');

// This endpoint is called by the frontend when it detects an anomaly
router.post('/trigger', protect, triggerAlert);

module.exports = router;