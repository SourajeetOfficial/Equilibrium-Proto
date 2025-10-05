// routes/contacts.js
const express = require('express');
const router = express.Router();
const { 
    addEmergencyContact, 
    getEmergencyContacts, 
    deleteEmergencyContact 
} = require('../controllers/contactController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// Routes for Emergency Contacts
router.route('/emergency')
    .post(addEmergencyContact)
    .get(getEmergencyContacts);

router.delete('/emergency/:contactId', deleteEmergencyContact);

module.exports = router;