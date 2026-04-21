require('dotenv').config();

const express = require('express');

// Fix BigInt serialization for JSON
BigInt.prototype.toJSON = function () {
  return Number(this);
};
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');

const routes = require('./src/routes');
const { errorHandler } = require('./src/middlewares/errorHandler.middleware');
const { initializeDefaultSettings } = require('./src/controllers/settings.controller');
const { initializeWebSocket } = require('./src/services/websocket.service');
const { seedPermissions, seedPermissionTemplates } = require('./src/utils/permissions.seed');

const app = express();
const PORT = process.env.PORT || 3004;

// Trust proxy to respect X-Forwarded-For in production (Nginx, cloud)
app.set('trust proxy', 1);

// Create HTTP server for WebSocket support
const server = http.createServer(app);

// Initialize WebSocket
initializeWebSocket(server);

// Security Middleware
app.use(helmet());

// CORS Configuration
const corsOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

const resolvedCorsOrigins = corsOrigins.length ? corsOrigins : ['http://localhost:5173'];

if (!corsOrigins.length) {
  console.warn('⚠️  CORS_ORIGIN not set — defaulting to http://localhost:5173');
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (resolvedCorsOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
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

// Start Server (using http server instead of app.listen)
server.listen(PORT, async () => {
  try {
    await seedPermissions();
    await seedPermissionTemplates();
    console.log('✅ Permissions seeded');
  } catch (error) {
    console.error('⚠️ Failed to seed permissions:', error.message);
  }

  try {
    await initializeDefaultSettings();
    console.log('✅ Default settings initialized');
  } catch (error) {
    console.error('⚠️ Failed to initialize default settings:', error.message);
  }

  // Initialize Cron Jobs
  const { initializeCronJobs } = require('./src/services/cron.service');
  initializeCronJobs();

  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;

