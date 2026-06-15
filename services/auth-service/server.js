require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');

BigInt.prototype.toJSON = function () { return Number(this); };

const routes = require('./src/routes');
const { errorHandler } = require('../../packages/shared/src/middlewares/errorHandler.middleware');
const { initializeDefaultSettings } = require('./src/controllers/settings.controller');
const { seedPermissions, seedPermissionTemplates } = require('../../packages/shared/src/utils/permissions.seed');

const app = express();
const PORT = process.env.PORT || 3001;

app.set('trust proxy', 1);

const corsOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);
const resolvedCorsOrigins = corsOrigins.length ? corsOrigins : ['http://localhost:5173'];

app.use(helmet());
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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => res.status(200).json({ status: 'ok', service: 'auth-service', timestamp: new Date().toISOString() }));

app.use('/api', routes);

app.use((req, res) => res.status(404).json({ message: 'Route not found', path: req.originalUrl }));
app.use(errorHandler);

app.listen(PORT, async () => {
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
  console.log(`🚀 Auth Service running on port ${PORT}`);
});

module.exports = app;
