// server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const cron = require('node-cron');
const { cleanupUnverifiedUsers } = require('./services/maintenanceService');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(express.json()); // Body parser for JSON
app.use(cors({
    origin: ["http://localhost:19006", "exp://192.168.29.137:8081"], // Add your Expo dev URLs
    credentials: true,
  }),
);         // Enable Cross-Origin Resource Sharing

// --- Utility Routes ---
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'UP' });
});

// --- Main API Routes ---
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/aggregates', require('./routes/aggregate'));
app.use('/api/v1/alerts', require('./routes/alerts'));
app.use('/api/v1/reports', require('./routes/reports'));
app.use('/api/v1/help-directory', require('./routes/helpDirectory'));
app.use('/api/v1/forum', require('./routes/forum'));
app.use('/api/v1/contacts', require('./routes/contacts'));

// --- Scheduled Jobs ---
// Schedule the cleanup job to run once every day at 2:00 AM India time.
cron.schedule('0 2 * * *', () => {
  cleanupUnverifiedUsers();
}, {
  scheduled: true,
  timezone: "Asia/Kolkata"
});

const PORT = process.env.PORT ;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});