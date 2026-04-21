/**
 * In-memory rate limiter (no Redis dependency).
 * Windows are tracked per-key with a simple counter + expiry timestamp.
 */
const _store = {};

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
 * Generic rate limiter middleware (in-memory).
 * @param {string} keyPrefix        Prefix for the rate-limit key
 * @param {number} limit            Maximum requests allowed in the window
 * @param {number} windowSeconds    Time window in seconds
 * @param {function} [keyExtractor] Optional fn(req) => string to derive the identifier (defaults to IP)
 */
const rateLimiter = (keyPrefix, limit, windowSeconds, keyExtractor = null) => {
    return (req, res, next) => {
        const identifier = keyExtractor ? (keyExtractor(req) || 'unknown') : getClientIp(req);
        const key = `${keyPrefix}:${identifier}`;
        const now = Date.now();

        if (!_store[key] || _store[key].resetAt < now) {
            _store[key] = { count: 1, resetAt: now + windowSeconds * 1000 };
        } else {
            _store[key].count++;
        }

        if (_store[key].count > limit) {
            const retryAfter = Math.ceil((_store[key].resetAt - now) / 1000);
            return res.status(429).json({
                message: `Zu viele Anfragen. Bitte versuche es in ${Math.ceil(retryAfter / 60)} Minuten erneut.`,
                retryAfter
            });
        }

        next();
    };
};

module.exports = { rateLimiter };
