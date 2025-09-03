// server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(express.json()); // Body parser for JSON
app.use(cors());         // Enable Cross-Origin Resource Sharing

// API Routes
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/aggregates', require('./routes/aggregate'));
app.use('/api/v1/alerts', require('./routes/alerts'));
app.use('/api/v1/reports', require('./routes/reports'));
app.use('/api/v1/help-directory', require('./routes/helpDirectory'));
app.use('/api/v1/forum', require('./routes/forum'));
app.use('/api/v1/contacts', require('./routes/contacts'));

// Simple health check endpoint-- Utility Routes
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'UP' });
});


const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});