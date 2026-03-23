const Redis = require('ioredis');

// Connection to Redis
const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    maxRetriesPerRequest: null
});

const getClientIp = (req) => {
    const forwarded = req.headers['x-forwarded-for'];
    const forwardedIp = Array.isArray(forwarded)
        ? forwarded[0]
        : typeof forwarded === 'string'
            ? forwarded.split(',')[0].trim()
            : null;
    return forwardedIp || req.ip || req.socket.remoteAddress || 'unknown';
};

/**
 * Generic rate limiter middleware using Redis.
 * @param {string} keyPrefix  Prefix for the Redis key (e.g. 'ratelimit:login:email')
 * @param {number} limit      Maximum number of requests allowed in the window
 * @param {number} windowSeconds  Time window in seconds
 * @param {function} [keyExtractor]  Optional fn(req) => string to derive the identifier.
 *                                   Defaults to client IP when omitted.
 */
const rateLimiter = (keyPrefix, limit, windowSeconds, keyExtractor = null) => {
    return async (req, res, next) => {
        const identifier = keyExtractor ? (keyExtractor(req) || 'unknown') : getClientIp(req);
        const key = `${keyPrefix}:${identifier}`;

        try {
            const currentCount = await redis.incr(key);

            if (currentCount === 1) {
                // Set expiry on the first request in the window
                await redis.expire(key, windowSeconds);
            }

            if (currentCount > limit) {
                const ttl = await redis.ttl(key);
                return res.status(429).json({
                    message: `Zu viele Anfragen. Bitte versuche es in ${Math.ceil(ttl / 60)} Minuten erneut.`,
                    retryAfter: ttl
                });
            }

            next();
        } catch (error) {
            console.error('Rate limiter error (Redis unavailable) — using in-memory fallback:', error.message);
            // In-memory fallback: allow up to limit requests per window without Redis
            const now = Date.now();
            if (!rateLimiter._fallback) rateLimiter._fallback = {};
            const fb = rateLimiter._fallback;
            if (!fb[key] || fb[key].resetAt < now) {
                fb[key] = { count: 1, resetAt: now + windowSeconds * 1000 };
            } else {
                fb[key].count++;
            }
            if (fb[key].count > limit) {
                const retryAfter = Math.ceil((fb[key].resetAt - now) / 1000);
                return res.status(429).json({
                    message: `Zu viele Anfragen. Bitte versuche es in ${Math.ceil(retryAfter / 60)} Minuten erneut.`,
                    retryAfter
                });
            }
            next();
        }
    };
};

module.exports = { rateLimiter };
