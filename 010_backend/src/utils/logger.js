/**
 * Application Logger
 * Winston with daily log rotation + in-memory circular buffer for the admin live-feed.
 *
 * Log format:
 *   2024-05-20 19:00:10 INFO  User:123        - Login erfolgreich (Browser: Chrome)
 *   2024-05-20 19:05:22 WARN  Email:foo@…      - Login fehlgeschlagen (User: 'admin')
 *   2024-05-21 02:00:00 ERROR BullMQ          - Reminder-Job fehlgeschlagen (Redis Connection Timeout)
 *
 * Every log entry may include an optional `email` field and an `error` object
 * (stack/message) – particularly useful when capturing exceptions.
 *
 * Usage:
 *   const logger = require('./logger');
 *   logger.info ({ userId: 123, email: 'foo@bar', action: 'LOGIN',             info: 'erfolgreich (Chrome)' });
 *   logger.warn ({ ip: '1.2.3.4',     email: 'foo@bar', action: 'LOGIN_FAILED',      info: "Wrong password" });
 *   logger.error({ source: 'BullMQ',  action: 'REMINDER_FAILED',   info: 'Redis Timeout', error: err });
 */

const path        = require('path');
const winston     = require('winston');
require('winston-daily-rotate-file');

// ── Constants ────────────────────────────────────────────────────────────────

const LOG_DIR        = path.join(process.cwd(), 'logs');
const BUFFER_SIZE    = 200; // entries kept in memory for the live-feed

// ── Circular in-memory buffer ────────────────────────────────────────────────

const buffer = [];

function pushToBuffer(entry) {
    buffer.unshift(entry);          // newest first
    if (buffer.length > BUFFER_SIZE) buffer.pop();
}

// ── Winston custom format ────────────────────────────────────────────────────

const lineFormat = winston.format.printf(({ timestamp, level, message }) => {
    return `${timestamp} ${level.toUpperCase().padEnd(5)} ${message}`;
});

// ── Transports ───────────────────────────────────────────────────────────────

const fileTransport = new winston.transports.DailyRotateFile({
    dirname:        LOG_DIR,
    filename:       '%DATE%.log',
    datePattern:    'YYYY-MM-DD',
    zippedArchive:  false,
    maxFiles:       '30d',          // auto-delete after 30 days (DSGVO)
    level:          'info',
});

const consoleTransport = new winston.transports.Console({
    format: winston.format.combine(
        winston.format.colorize(),
        lineFormat,
    ),
});

// ── Winston instance ─────────────────────────────────────────────────────────

const winstonLogger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        lineFormat,
    ),
    transports: [fileTransport, consoleTransport],
});

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build the "actor" token: "User:123", "IP:1.2.3.4", or "System".
 */
function actor({ userId, email, ip, source } = {}) {
    // if a specific source (e.g. BullMQ, System) is provided, use it verbatim
    if (source) return source;

    // prefer user id when available, include email if known
    if (userId != null) {
        return email ? `User:${userId} <${email}>` : `User:${userId}`;
    }

    // if no user id but an email is supplied (e.g. failed login lookup)
    if (email) {
        return `Email:${email}`;
    }

    if (ip) return `IP:${ip}`;

    return 'System';
}

/**
 * Build the log message string and an entry object for the buffer.
 * @param {'INFO'|'WARN'|'ERROR'} level
 * @param {{ userId?, ip?, source?, action, info }} params
 */
function buildEntry(level, { userId = null, email = null, ip = null, source = null, action, info = '', error = null }) {
    const ts  = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const act = actor({ userId, email, ip, source });

    // attach error message/stack if provided
    let extra = '';
    if (error) {
        if (error instanceof Error) {
            extra = ` – ${error.message}`;
            // include stack for buffer but keep file log concise
            info = info ? `${info}; ${error.message}` : error.message;
        } else {
            extra = ` – ${String(error)}`;
            info = info ? `${info}; ${String(error)}` : String(error);
        }
    }

    const msg = `${act.padEnd(20)} - ${action}${info ? ` (${info})` : ''}`;
    return {
        id:        `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: ts,
        level,
        actor:     act,
        userId,
        email,
        action,
        info,
        error:      error instanceof Error ? error.stack || error.message : error,
        message:   msg,
    };
}

/**
 * Broadcast a log entry to WebSocket admins (lazy import to avoid circular deps).
 */
function broadcastEntry(entry) {
    try {
        const { getIO } = require('../services/websocket.service');
        const io = getIO();
        if (io) io.to('workspace').emit('log:entry', entry);
    } catch (_) {
        // WebSocket not yet ready – safe to ignore
    }
}

// ── Public API ───────────────────────────────────────────────────────────────

const logger = {
    /**
     * @param {{ userId?, email?, ip?, source?, action: string, info?: string, error?: any }} params
     *        - `email` is logged when available to identify users in entries
     *        - `error` may be an Error object whose message/stack are appended
     */
    info(params) {
        const entry = buildEntry('INFO', params);
        winstonLogger.info(entry.message);
        pushToBuffer(entry);
        broadcastEntry(entry);
    },

    /**
     * @param {{ userId?, email?, ip?, source?, action: string, info?: string, error?: any }} params
     */
    warn(params) {
        const entry = buildEntry('WARN', params);
        winstonLogger.warn(entry.message);
        pushToBuffer(entry);
        broadcastEntry(entry);
    },

    /**
     * @param {{ userId?, email?, ip?, source?, action: string, info?: string, error?: any }} params
     *        - if `params.error` is provided the message or stack will be logged
     */
    error(params) {
        const entry = buildEntry('ERROR', params);
        winstonLogger.error(entry.message);
        pushToBuffer(entry);
        broadcastEntry(entry);
    },

    /** Returns last N buffer entries (newest first). */
    getBuffer(limit = 50, levelFilter = null) {
        const entries = levelFilter
            ? buffer.filter(e => e.level === levelFilter.toUpperCase())
            : buffer;
        return entries.slice(0, limit);
    },

    /** Returns simple stats from the buffer. */
    getStats() {
        const counts = { INFO: 0, WARN: 0, ERROR: 0 };
        buffer.forEach(e => { if (counts[e.level] !== undefined) counts[e.level]++; });
        return { total: buffer.length, ...counts };
    },
};

module.exports = logger;
