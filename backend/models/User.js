const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

// Note: We will define the EncryptedContact schema when we build that feature.
const EncryptedContact = new mongoose.Schema({
    data: { type: String, required: true },
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true } // Give each contact a unique ID for deletion
});

const userSchema = new mongoose.Schema(
  {
    pseudonymId: { // Standardized to camelCase
      type: String,
      unique: true,
      sparse: true, // Tells the index to ignore null values
    
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false, // Don't send password in responses by default
    },
    pushToken: {
      type: String,
    },
    consentFlags: {
      usageTracking: { type: Boolean, default: false },
      cloudSync: { type: Boolean, default: false },
      emergencyContacts: { type: Boolean, default: false },
      closeContacts: { type: Boolean, default: false }, // Added from roadmap
    },

  // ENCRYPTION KEY
    dataEncryptionKey: {
      type: String,
      select: false, // Never send this key in responses
    },

    emergencyContacts: [EncryptedContact],
    closeContacts: [EncryptedContact],
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
  }

  // Generate pseudonymId only for new users
  if (!this.pseudonymId) {
    this.pseudonymId = crypto.randomUUID();
  }

  // ADD THIS: Generate encryption key only for new users
  if (!this.dataEncryptionKey) {
    this.dataEncryptionKey = crypto.randomBytes(32).toString("hex");
  }
  
  next();
});

// Compare password method
userSchema.methods.matchPassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// --- NEW ENCRYPTION HELPER METHODS ---

// Encrypt contact data before saving
userSchema.methods.encryptContact = function (contactObject) {
    const algorithm = 'aes-256-cbc';
    const key = Buffer.from(this.dataEncryptionKey, 'hex');
    const iv = crypto.randomBytes(16); // Initialization vector
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(JSON.stringify(contactObject), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted; // Store IV with the data
};

// Decrypt contact data when fetching
userSchema.methods.decryptContact = function (encryptedString) {
    try {
        const algorithm = 'aes-256-cbc';
        const key = Buffer.from(this.dataEncryptionKey, 'hex');
        const textParts = encryptedString.split(':');
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv(algorithm, key, iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return JSON.parse(decrypted.toString());
    } catch (error) {
        console.error("Decryption failed:", error);
        return null; // Return null if decryption fails
    }
};

module.exports = mongoose.model("User", userSchema);