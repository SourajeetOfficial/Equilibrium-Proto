// controllers/contactController.js
const User = require('../models/User');

// @desc    Add an emergency contact
// @route   POST /api/v1/contacts/emergency
// @access  Private
exports.addEmergencyContact = async (req, res) => {
    try {
        // We must select '+dataEncryptionKey' as it's hidden by default
        const user = await User.findById(req.user._id).select('+dataEncryptionKey');
        
        // Use the encryptContact method from the User model
        const encryptedData = user.encryptContact(req.body);
        
        user.emergencyContacts.push({ data: encryptedData });
        await user.save();
        
        res.status(201).json({ success: true, message: 'Emergency contact added securely.' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Get all emergency contacts
// @route   GET /api/v1/contacts/emergency
// @access  Private
exports.getEmergencyContacts = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('+dataEncryptionKey');
        
        // Use the decryptContact method to securely decrypt each contact for the user
        const decryptedContacts = user.emergencyContacts.map(contact => {
            const decrypted = user.decryptContact(contact.data);
            return { ...decrypted, _id: contact._id }; // Return decrypted data with its unique ID
        });
        
        res.status(200).json({ success: true, data: decryptedContacts });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Delete an emergency contact
// @route   DELETE /api/v1/contacts/emergency/:contactId
// @access  Private
exports.deleteEmergencyContact = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        
        // Mongoose's .pull() method is a clean way to remove an item from an array
        user.emergencyContacts.pull({ _id: req.params.contactId });
        await user.save();

        res.status(200).json({ success: true, message: 'Emergency contact removed.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};