// models/User.js (Final Corrected Version)
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const EncryptedContact = new mongoose.Schema({
    data: { type: String, required: true },
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true }
});

const userSchema = new mongoose.Schema(
  {
    pseudonymId: {
      type: String,
      unique: true,
      sparse: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 20
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
      
    isVerified: {
      type: Boolean,
      default: false,
    },

    verificationToken: String,

    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    
    passwordResetToken: String,
    passwordResetExpires: Date,

    pushToken: {
      type: String,
    },
    consentFlags: {
      usageTracking: { type: Boolean, default: false },
      cloudSync: { type: Boolean, default: false },
      emergencyContacts: { type: Boolean, default: false },
      closeContacts: { type: Boolean, default: false }, 
    },
    dataEncryptionKey: {
      type: String,
      select: false,
    },
    // REMOVED: closeContacts is now a frontend-only feature
    emergencyContacts: [EncryptedContact],
  },

  {
    timestamps: true,
  }
);

// --- Hooks and Methods are Correct ---
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
  }
  if (!this.pseudonymId) {
    this.pseudonymId = crypto.randomUUID();
  }
  if (!this.dataEncryptionKey) {
    this.dataEncryptionKey = crypto.randomBytes(32).toString("hex");
  }
  next();
});

userSchema.methods.matchPassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.encryptContact = function (contactObject) {
    const algorithm = 'aes-256-cbc';
    const key = Buffer.from(this.dataEncryptionKey, 'hex');
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(JSON.stringify(contactObject), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
};

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
        return null;
    }
};

module.exports = mongoose.model("User", userSchema);