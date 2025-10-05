// routes/helpDirectory.js
const express = require('express');
const router = express.Router();
const { getHelpResources } = require('../controllers/helpDirectoryController');

router.get('/', getHelpResources);

module.exports = router;