require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const http = require('http');

const routes = require('./src/routes');
const { errorHandler } = require('./src/middlewares/errorHandler.middleware');
const { initializeDefaultSettings } = require('./src/controllers/settings.controller');
const { initializeWebSocket, attachIO } = require('./src/services/websocket.service');

const app = express();
const PORT = process.env.PORT || 3004;

// Create HTTP server for WebSocket support
const server = http.createServer(app);

// Initialize WebSocket
const io = initializeWebSocket(server);

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

// Attach Socket.io to requests for workspace routes
app.use('/api/workspace', attachIO);

// Static serving for CMS uploads
app.use('/uploads/cms/carousel', express.static(path.join(process.cwd(), 'uploads/cms/carousel')));
app.use('/uploads/cms/sponsors', express.static(path.join(process.cwd(), 'uploads/cms/sponsors')));
app.use('/uploads/cms/gallery', express.static(path.join(process.cwd(), 'uploads/cms/gallery')));
app.use('/uploads/cms/flyers', express.static(path.join(process.cwd(), 'uploads/cms/flyers')));

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

// Start Server (using http server instead of app.listen)
server.listen(PORT, async () => {
  // Initialize default settings
  try {
    await initializeDefaultSettings();
    console.log('✅ Default settings initialized');
  } catch (error) {
    console.error('⚠️ Failed to initialize default settings:', error.message);
    console.log('⚠️ Failed to initialize default settings:', error.message);
  }

  // Initialize Push Service
  try {
    const pushService = require('./src/services/push.service');
    pushService.initializePushService();
  } catch (error) {
    console.error('⚠️ Failed to initialize Push Service:', error.message);
  }

  // Initialize Cron Jobs
  const { initializeCronJobs } = require('./src/services/cron.service');
  initializeCronJobs();

  // Initialize Reminder Queue
  try {
    const { initializeReminderQueue, syncReminders } = require('./src/services/reminder.queue.service');
    initializeReminderQueue();
    // Sync reminders after initialization (async)
    syncReminders().catch(err => console.error('⚠️ Reminder sync failed:', err));
  } catch (error) {
    console.error('⚠️ Failed to initialize Reminder Queue:', error.message);
  }

  // Run once immediately on startup for testing/development (Optional, maybe remove in prod)
  // const notificationService = require('./src/services/notification.service');
  // notificationService.sendEventReminders(); // Call explicitly if needed for debug

  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;

