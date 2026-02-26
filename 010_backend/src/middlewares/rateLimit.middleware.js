const Redis = require('ioredis');

// Connection to Redis
const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    maxRetriesPerRequest: null
});

/**
 * Simple rate limiter middleware using Redis
 * @param {string} keyPrefix Prefix for the redis key (e.g. 'ratelimit:contact')
 * @param {number} limit Maximum number of requests allowed
 * @param {number} windowSeconds Time window in seconds
 */
const rateLimiter = (keyPrefix, limit, windowSeconds) => {
    return async (req, res, next) => {
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const key = `${keyPrefix}:${ip}`;

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
