require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');

BigInt.prototype.toJSON = function () { return Number(this); };

const routes = require('./src/routes');
const { errorHandler } = require('../../packages/shared/src/middlewares/errorHandler.middleware');
const { initializeWebSocket } = require('./src/services/websocket.service');
const bridge = require('../../packages/shared/src/services/websocket-bridge');

const app = express();
const PORT = process.env.PORT || 3004;
const server = http.createServer(app);

const io = initializeWebSocket(server);
bridge.setIO(io);

app.set('trust proxy', 1);
const corsOrigins = (process.env.CORS_ORIGIN || '').split(',').map(o => o.trim()).filter(Boolean);
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
app.get('/health', (req, res) => res.status(200).json({ status: 'ok', service: 'chat-service' }));
app.use('/api', routes);
app.use(errorHandler);

server.listen(PORT, () => console.log(`🚀 Chat Service on port ${PORT}`));
module.exports = app;