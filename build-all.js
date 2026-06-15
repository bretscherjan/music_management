const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '010_backend');
const baseDir = __dirname;

function copyAndTransform(srcRelative, destRelative, replacements = {}) {
    const srcPath = path.join(srcDir, srcRelative);
    const destPath = path.join(baseDir, destRelative);
    
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    
    if (!fs.existsSync(srcPath)) {
        console.error(`Missing: ${srcPath}`);
        return;
    }

    let content = fs.readFileSync(srcPath, 'utf8');
    for (const [search, replace] of Object.entries(replacements)) {
        content = content.replace(new RegExp(search, 'g'), replace);
    }
    fs.writeFileSync(destPath, content);
    console.log(`Copied & transformed ${destRelative}`);
}

// ============================================================================
// 1. SHARED PACKAGE
// ============================================================================
const sharedPkg = {
  "name": "@music-management/shared",
  "version": "1.0.0",
  "description": "Shared utilities for music-management microservices",
  "main": "index.js",
  "dependencies": {
    "@prisma/client": "^5.8.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "winston": "^3.19.0",
    "winston-daily-rotate-file": "^5.0.0",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "prisma": "^5.8.0"
  }
};
fs.mkdirSync(path.join(baseDir, 'packages/shared'), { recursive: true });
fs.writeFileSync(path.join(baseDir, 'packages/shared/package.json'), JSON.stringify(sharedPkg, null, 2));

// Prisma
copyAndTransform('prisma/schema.prisma', 'packages/shared/prisma/schema.prisma');
copyAndTransform('prisma/seed.js', 'packages/shared/prisma/seed.js');

// Utils
copyAndTransform('src/utils/prisma.js', 'packages/shared/src/utils/prisma.js');
copyAndTransform('src/utils/permissions.js', 'packages/shared/src/utils/permissions.js');
copyAndTransform('src/utils/permissions.seed.js', 'packages/shared/src/utils/permissions.seed.js');

// Logger - special transform for websocket-bridge
copyAndTransform('src/utils/logger.js', 'packages/shared/src/utils/logger.js', {
    "'\\.\\./services/websocket\\.service'": "'../../services/websocket-bridge'"
});

// Middlewares
copyAndTransform('src/middlewares/auth.middleware.js', 'packages/shared/src/middlewares/auth.middleware.js');
copyAndTransform('src/middlewares/errorHandler.middleware.js', 'packages/shared/src/middlewares/errorHandler.middleware.js');
copyAndTransform('src/middlewares/permission.middleware.js', 'packages/shared/src/middlewares/permission.middleware.js');
copyAndTransform('src/middlewares/roleCheck.middleware.js', 'packages/shared/src/middlewares/roleCheck.middleware.js');
copyAndTransform('src/middlewares/rateLimit.middleware.js', 'packages/shared/src/middlewares/rateLimit.middleware.js');
copyAndTransform('src/middlewares/validate.middleware.js', 'packages/shared/src/middlewares/validate.middleware.js');

// Validations
['auth', 'user', 'event', 'file', 'sheetMusic', 'workspace'].forEach(v => {
    copyAndTransform(`src/validations/${v}.validation.js`, `packages/shared/src/validations/${v}.validation.js`);
});

// Websocket bridge
const wsBridge = `
let _io = null;
function getIO() { return _io; }
function setIO(io) { _io = io; }
module.exports = { getIO, setIO };
`;
fs.mkdirSync(path.join(baseDir, 'packages/shared/src/services'), { recursive: true });
fs.writeFileSync(path.join(baseDir, 'packages/shared/src/services/websocket-bridge.js'), wsBridge.trim());


// ============================================================================
// 2. AUTH SERVICE (Remaining files not created manually)
// ============================================================================
// I've already created package.json, .env, server.js, src/routes/index.js, Dockerfile manually.
// The previous script handled auth service routes and controllers, but let's redo it here to be safe.
['auth', 'admin', 'user', 'register', 'settings', 'contact', 'public'].forEach(r => {
    copyAndTransform(`src/routes/${r}.routes.js`, `services/auth-service/src/routes/${r}.routes.js`, {
        "'\\.\\./middlewares/": "'../../../packages/shared/src/middlewares/",
        "'\\.\\./validations/": "'../../../packages/shared/src/validations/"
    });
});
['auth', 'admin', 'user', 'register', 'settings', 'contact'].forEach(c => {
    copyAndTransform(`src/controllers/${c}.controller.js`, `services/auth-service/src/controllers/${c}.controller.js`, {
        "'\\.\\./middlewares/": "'../../../packages/shared/src/middlewares/",
        "'\\.\\./utils/": "'../../../packages/shared/src/utils/"
    });
});


// ============================================================================
// 3. EVENT SERVICE
// ============================================================================
const eventPkg = {
  "name": "event-service",
  "version": "1.0.0",
  "description": "Event & Calendar Management Microservice",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "prisma:generate": "npx prisma@5.8.0 generate --schema=../../packages/shared/prisma/schema.prisma"
  },
  "dependencies": {
    "@prisma/client": "^5.8.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "helmet": "^7.1.0",
    "ics": "^3.8.1",
    "jsonwebtoken": "^9.0.2",
    "luxon": "^3.7.2",
    "node-cron": "^4.2.1",
    "pdfkit": "^0.17.2",
    "pdfmake": "^0.3.3",
    "rrule": "^2.7.2",
    "winston": "^3.19.0",
    "winston-daily-rotate-file": "^5.0.0",
    "zod": "^3.22.4"
  }
};
fs.mkdirSync(path.join(baseDir, 'services/event-service'), { recursive: true });
fs.writeFileSync(path.join(baseDir, 'services/event-service/package.json'), JSON.stringify(eventPkg, null, 2));

const eventEnv = `PORT=3002\nNODE_ENV=production\nDATABASE_URL=mysql://music_management_user:music_management_pass@db:3306/music_management\nJWT_SECRET=df03b9c4954d1c5023c8bb3825370af5a8fce0d2691cb752dd3b3b3e7606fe6abe8bd4c4130db15c4c6e7a784bcc4e8bea96f48d45923ea80a854ee0f02a9eaf\nJWT_EXPIRES_IN=7d\nCORS_ORIGIN=http://localhost\nPUBLIC_ADMIN_MODE=false`;
fs.writeFileSync(path.join(baseDir, 'services/event-service/.env'), eventEnv);

const eventServer = `require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

BigInt.prototype.toJSON = function () { return Number(this); };

const routes = require('./src/routes');
const { errorHandler } = require('../../packages/shared/src/middlewares/errorHandler.middleware');

const app = express();
const PORT = process.env.PORT || 3002;

app.set('trust proxy', 1);

const corsOrigins = (process.env.CORS_ORIGIN || '').split(',').map(o => o.trim()).filter(Boolean);
const resolvedCorsOrigins = corsOrigins.length ? corsOrigins : ['http://localhost:5173'];

app.use(helmet());
app.use(cors({ origin: (origin, callback) => { if (!origin) return callback(null, true); if (resolvedCorsOrigins.includes(origin)) return callback(null, true); return callback(new Error('Not allowed by CORS')); }, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get('/health', (req, res) => res.status(200).json({ status: 'ok', service: 'event-service' }));
app.use('/api', routes);
app.use(errorHandler);

app.listen(PORT, () => console.log(\`🚀 Event Service on port \${PORT}\`));
module.exports = app;`;
fs.writeFileSync(path.join(baseDir, 'services/event-service/server.js'), eventServer);

const eventIndex = `const express = require('express');
const router = express.Router();
router.use('/events', require('./event.routes'));
router.use('/calendar', require('./calendar.routes'));
router.use('/polls', require('./poll.routes'));
router.use('/notifications', require('./notification.routes'));
module.exports = router;`;
fs.mkdirSync(path.join(baseDir, 'services/event-service/src/routes'), { recursive: true });
fs.writeFileSync(path.join(baseDir, 'services/event-service/src/routes/index.js'), eventIndex);

// Event Routes & Controllers
['event', 'calendar', 'poll', 'notification'].forEach(r => {
    copyAndTransform(`src/routes/${r}.routes.js`, `services/event-service/src/routes/${r}.routes.js`, {
        "'\\.\\./middlewares/": "'../../../packages/shared/src/middlewares/",
        "'\\.\\./validations/": "'../../../packages/shared/src/validations/"
    });
    copyAndTransform(`src/controllers/${r}.controller.js`, `services/event-service/src/controllers/${r}.controller.js`, {
        "'\\.\\./middlewares/": "'../../../packages/shared/src/middlewares/",
        "'\\.\\./utils/logger'": "'../../../packages/shared/src/utils/logger'",
        "'\\.\\./services/websocket\\.service'": "'../../../packages/shared/src/services/websocket-bridge'"
    });
});

// Event Services
['recurrence', 'reminder.queue', 'notification'].forEach(s => {
    copyAndTransform(`src/services/${s}.service.js`, `services/event-service/src/services/${s}.service.js`, {
        "'\\.\\./middlewares/": "'../../../packages/shared/src/middlewares/"
    });
});

// Event Dockerfile
const eventDocker = `FROM node:20-slim AS base
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY packages/shared/package.json ./packages/shared/
RUN cd packages/shared && npm install
COPY services/event-service/package.json ./services/event-service/
RUN cd services/event-service && npm install
COPY packages/shared/ ./packages/shared/
COPY services/event-service/ ./services/event-service/
RUN cd services/event-service && npx prisma generate --schema=../../packages/shared/prisma/schema.prisma
WORKDIR /app/services/event-service
EXPOSE 3002
CMD ["node", "server.js"]`;
fs.writeFileSync(path.join(baseDir, 'services/event-service/Dockerfile'), eventDocker);


// ============================================================================
// 4. FILE SERVICE
// ============================================================================
const filePkg = {
  "name": "file-service",
  "version": "1.0.0",
  "description": "File, Folder & Sheet Music Management Microservice",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "prisma:generate": "npx prisma@5.8.0 generate --schema=../../packages/shared/prisma/schema.prisma"
  },
  "dependencies": {
    "@prisma/client": "^5.8.0",
    "archiver": "^7.0.1",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.2",
    "multer": "^1.4.5-lts.1",
    "pdfkit": "^0.17.2",
    "pdfmake": "^0.3.3",
    "uuid": "^13.0.0",
    "winston": "^3.19.0",
    "winston-daily-rotate-file": "^5.0.0",
    "zod": "^3.22.4"
  }
};
fs.mkdirSync(path.join(baseDir, 'services/file-service'), { recursive: true });
fs.writeFileSync(path.join(baseDir, 'services/file-service/package.json'), JSON.stringify(filePkg, null, 2));

const fileEnv = `PORT=3003\nNODE_ENV=production\nDATABASE_URL=mysql://music_management_user:music_management_pass@db:3306/music_management\nJWT_SECRET=df03b9c4954d1c5023c8bb3825370af5a8fce0d2691cb752dd3b3b3e7606fe6abe8bd4c4130db15c4c6e7a784bcc4e8bea96f48d45923ea80a854ee0f02a9eaf\nJWT_EXPIRES_IN=7d\nCORS_ORIGIN=http://localhost\nUPLOAD_DIR=uploads\nMAX_FILE_SIZE=10485760\nPUBLIC_ADMIN_MODE=false`;
fs.writeFileSync(path.join(baseDir, 'services/file-service/.env'), fileEnv);

const fileServer = `require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
BigInt.prototype.toJSON = function () { return Number(this); };
const routes = require('./src/routes');
const { errorHandler } = require('../../packages/shared/src/middlewares/errorHandler.middleware');
const app = express();
const PORT = process.env.PORT || 3003;
app.set('trust proxy', 1);
const corsOrigins = (process.env.CORS_ORIGIN || '').split(',').map(o => o.trim()).filter(Boolean);
const resolvedCorsOrigins = corsOrigins.length ? corsOrigins : ['http://localhost:5173'];
app.use(helmet());
app.use(cors({ origin: (origin, callback) => { if (!origin) return callback(null, true); if (resolvedCorsOrigins.includes(origin)) return callback(null, true); return callback(new Error('Not allowed by CORS')); }, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
app.use('/uploads', express.static(path.join(process.cwd(), uploadDir)));
app.get('/health', (req, res) => res.status(200).json({ status: 'ok', service: 'file-service' }));
app.use('/api', routes);
app.use(errorHandler);
app.listen(PORT, () => console.log(\`🚀 File Service on port \${PORT}\`));
module.exports = app;`;
fs.writeFileSync(path.join(baseDir, 'services/file-service/server.js'), fileServer);

const fileIndex = `const express = require('express');
const router = express.Router();
router.use('/files', require('./file.routes'));
router.use('/folders', require('./folder.routes'));
router.use('/sheet-music', require('./sheetMusic.routes'));
router.use('/music-folders', require('./musicFolder.routes'));
router.use('/setlists', require('./setlist.routes'));
router.use('/search', require('./search.routes'));
router.use('/onlyoffice', require('./onlyoffice.routes'));
module.exports = router;`;
fs.mkdirSync(path.join(baseDir, 'services/file-service/src/routes'), { recursive: true });
fs.writeFileSync(path.join(baseDir, 'services/file-service/src/routes/index.js'), fileIndex);

// File Routes & Controllers
['file', 'folder', 'sheetMusic', 'musicFolder', 'setlist', 'search', 'onlyoffice'].forEach(r => {
    copyAndTransform(`src/routes/${r}.routes.js`, `services/file-service/src/routes/${r}.routes.js`, {
        "'\\.\\./middlewares/": "'../../../packages/shared/src/middlewares/",
        "'\\.\\./validations/": "'../../../packages/shared/src/validations/"
    });
    copyAndTransform(`src/controllers/${r}.controller.js`, `services/file-service/src/controllers/${r}.controller.js`, {
        "'\\.\\./middlewares/": "'../../../packages/shared/src/middlewares/",
        "'\\.\\./utils/logger'": "'../../../packages/shared/src/utils/logger'",
        "'\\.\\./utils/permissions'": "'../../../packages/shared/src/utils/permissions'",
        "'\\.\\./services/websocket\\.service'": "'../../../packages/shared/src/services/websocket-bridge'"
    });
});

// File Services & Utils
['fileToken', 'onlyoffice'].forEach(s => {
    copyAndTransform(`src/services/${s}.service.js`, `services/file-service/src/services/${s}.service.js`, {
        "'\\.\\./middlewares/": "'../../../packages/shared/src/middlewares/"
    });
});
copyAndTransform(`src/utils/pdfStyles.js`, `services/file-service/src/utils/pdfStyles.js`);

const fileDocker = `FROM node:20-slim AS base
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY packages/shared/package.json ./packages/shared/
RUN cd packages/shared && npm install
COPY services/file-service/package.json ./services/file-service/
RUN cd services/file-service && npm install
COPY packages/shared/ ./packages/shared/
COPY services/file-service/ ./services/file-service/
RUN cd services/file-service && npx prisma generate --schema=../../packages/shared/prisma/schema.prisma
WORKDIR /app/services/file-service
VOLUME ["/app/services/file-service/uploads"]
EXPOSE 3003
CMD ["node", "server.js"]`;
fs.writeFileSync(path.join(baseDir, 'services/file-service/Dockerfile'), fileDocker);


// ============================================================================
// 5. CHAT SERVICE
// ============================================================================
const chatPkg = {
  "name": "chat-service",
  "version": "1.0.0",
  "description": "Chat, WebSocket, Transcription & Protocol Microservice",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "prisma:generate": "npx prisma@5.8.0 generate --schema=../../packages/shared/prisma/schema.prisma"
  },
  "dependencies": {
    "@prisma/client": "^5.8.0",
    "axios": "^1.13.6",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.2",
    "multer": "^1.4.5-lts.1",
    "socket.io": "^4.8.3",
    "uuid": "^13.0.0",
    "winston": "^3.19.0",
    "winston-daily-rotate-file": "^5.0.0",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "form-data": "^4.0.5"
  }
};
fs.mkdirSync(path.join(baseDir, 'services/chat-service'), { recursive: true });
fs.writeFileSync(path.join(baseDir, 'services/chat-service/package.json'), JSON.stringify(chatPkg, null, 2));

const chatEnv = `PORT=3004\nNODE_ENV=production\nDATABASE_URL=mysql://music_management_user:music_management_pass@db:3306/music_management\nJWT_SECRET=df03b9c4954d1c5023c8bb3825370af5a8fce0d2691cb752dd3b3b3e7606fe6abe8bd4c4130db15c4c6e7a784bcc4e8bea96f48d45923ea80a854ee0f02a9eaf\nJWT_EXPIRES_IN=7d\nCORS_ORIGIN=http://localhost\nWHISPER_URL=http://whisper:8000\nOLLAMA_URL=http://ollama:11434\nOLLAMA_MODEL=llama3.1:8b\nLLM_PROVIDER=ollama\nPUBLIC_ADMIN_MODE=false`;
fs.writeFileSync(path.join(baseDir, 'services/chat-service/.env'), chatEnv);

const chatServer = `require('dotenv').config();
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
app.use(cors({ origin: (origin, callback) => { if (!origin) return callback(null, true); if (resolvedCorsOrigins.includes(origin)) return callback(null, true); return callback(new Error('Not allowed by CORS')); }, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get('/health', (req, res) => res.status(200).json({ status: 'ok', service: 'chat-service' }));
app.use('/api', routes);
app.use(errorHandler);

server.listen(PORT, () => console.log(\`🚀 Chat Service on port \${PORT}\`));
module.exports = app;`;
fs.writeFileSync(path.join(baseDir, 'services/chat-service/server.js'), chatServer);

const chatIndex = `const express = require('express');
const router = express.Router();
router.use('/chat', require('./chat.routes'));
router.use('/transcribe', require('./transcribe.routes'));
router.use('/protokoll', require('./protokoll.routes'));
module.exports = router;`;
fs.mkdirSync(path.join(baseDir, 'services/chat-service/src/routes'), { recursive: true });
fs.writeFileSync(path.join(baseDir, 'services/chat-service/src/routes/index.js'), chatIndex);

// Chat Routes & Controllers
['chat', 'transcribe', 'protokoll'].forEach(r => {
    copyAndTransform(`src/routes/${r}.routes.js`, `services/chat-service/src/routes/${r}.routes.js`, {
        "'\\.\\./middlewares/": "'../../../packages/shared/src/middlewares/",
        "'\\.\\./validations/": "'../../../packages/shared/src/validations/"
    });
    copyAndTransform(`src/controllers/${r}.controller.js`, `services/chat-service/src/controllers/${r}.controller.js`, {
        "'\\.\\./middlewares/": "'../../../packages/shared/src/middlewares/",
        "'\\.\\./utils/logger'": "'../../../packages/shared/src/utils/logger'"
    });
});

// Chat Services
['chat', 'chat-storage', 'chat-notification', 'websocket', 'llm'].forEach(s => {
    let replacements = {};
    if (s === 'chat-storage') {
        replacements["path\\.join\\(__dirname, '\\.\\./\\.\\./chat-data'\\)"] = "process.env.CHAT_DATA_DIR || path.join(process.cwd(), 'chat-data')";
    }
    if (s === 'websocket') {
        replacements["'\\.\\./utils/logger'"] = "'../../../../packages/shared/src/utils/logger'";
    }
    copyAndTransform(`src/services/${s}.service.js`, `services/chat-service/src/services/${s}.service.js`, replacements);
});

const chatDocker = `FROM node:20-slim AS base
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY packages/shared/package.json ./packages/shared/
RUN cd packages/shared && npm install
COPY services/chat-service/package.json ./services/chat-service/
RUN cd services/chat-service && npm install
COPY packages/shared/ ./packages/shared/
COPY services/chat-service/ ./services/chat-service/
RUN cd services/chat-service && npx prisma generate --schema=../../packages/shared/prisma/schema.prisma
WORKDIR /app/services/chat-service
VOLUME ["/app/services/chat-service/chat-data"]
EXPOSE 3004
CMD ["node", "server.js"]`;
fs.writeFileSync(path.join(baseDir, 'services/chat-service/Dockerfile'), chatDocker);

fs.mkdirSync(path.join(baseDir, 'services/chat-service/chat-data'), { recursive: true });
fs.writeFileSync(path.join(baseDir, 'services/chat-service/chat-data/.gitkeep'), '');
