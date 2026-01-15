require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const routes = require('./src/routes');
const { errorHandler } = require('./src/middlewares/errorHandler.middleware');
const { initializeDefaultSettings } = require('./src/controllers/settings.controller');

const app = express();
const PORT = process.env.PORT || 3000;

// Security Middleware
app.use(helmet());

// CORS Configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api', routes);

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Global Error Handler
app.use(errorHandler);

// Start Server
app.listen(PORT, async () => {
  // Initialize default settings
  try {
    await initializeDefaultSettings();
    console.log('✅ Default settings initialized');
  } catch (error) {
    console.error('⚠️ Failed to initialize default settings:', error.message);
  }

  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;

