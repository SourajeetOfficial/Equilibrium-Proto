// routes/aggregates.js
const express = require('express');
const router = express.Router();
const { logAggregate, getAggregates} = require('../controllers/aggregateController');
const { protect } = require('../middleware/authMiddleware');

// All aggregate routes are protected
router.use(protect);

// 2. Chain the GET and POST methods
router.route('/')
    .post(logAggregate)
    .get(getAggregates);

module.exports = router;