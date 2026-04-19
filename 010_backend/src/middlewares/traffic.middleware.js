const crypto = require('crypto');
const geoip = require('geoip-lite');
const prisma = require('../utils/prisma');

// Daily salt rotates at midnight — prevents cross-day linkability
function getDailySalt() {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    return crypto.createHash('sha256').update(today + (process.env.TRACKING_SECRET || 'musig-elgg-default-salt')).digest('hex');
}

function hashVisitor(ip, userAgent) {
    const salt = getDailySalt();
    return crypto.createHash('sha256').update(`${ip}|${userAgent}|${salt}`).digest('hex');
}

function detectDevice(userAgent) {
    if (!userAgent) return 'desktop';
    const ua = userAgent.toLowerCase();
    if (/tablet|ipad|playbook|silk/.test(ua)) return 'tablet';
    if (/mobile|iphone|ipod|android|blackberry|opera mini|windows phone/.test(ua)) return 'mobile';
    return 'desktop';
}

function getClientIp(req) {
    // Express trust proxy is enabled; req.ip gives the correct client IP
    return req.ip || req.connection?.remoteAddress || '127.0.0.1';
}

function getCountry(ip) {
    try {
        // Strip IPv6 prefix for IPv4-mapped addresses
        const cleanIp = ip.replace(/^::ffff:/, '');
        const geo = geoip.lookup(cleanIp);
        return geo?.country ?? null;
    } catch {
        return null;
    }
}

/**
 * trackPageView middleware
 * Fires an async, non-blocking write for every request that passes through it.
 * Call next() immediately so the response is never delayed.
 */
function trackPageView(req, res, next) {
    // Skip non-GET requests (POST, OPTIONS health checks, etc.)
    if (req.method !== 'GET') {
        return next();
    }

    // Fire-and-forget — never await, never block
    setImmediate(() => {
        try {
            const ip = getClientIp(req);
            const ua = req.headers['user-agent'] || '';
            const referrer = req.headers['referer'] || req.headers['referrer'] || null;
            const path = req.body?.path || req.query?.path || req.path || '/';
            const country = getCountry(ip);
            const deviceType = detectDevice(ua);
            const visitorHash = hashVisitor(ip, ua);

            prisma.pageView.create({
                data: {
                    path: path.slice(0, 500),
                    referrer: referrer ? referrer.slice(0, 500) : null,
                    country,
                    deviceType,
                    visitorHash,
                },
            }).catch(err => {
                // Silently swallow — analytics must never break the app
                process.env.NODE_ENV !== 'production' && console.warn('[Traffic] Failed to log pageview:', err.message);
            });
        } catch (err) {
            // Completely silent
        }
    });

    next();
}

/**
 * trackPageViewPost — for the dedicated POST /api/analytics/pageview endpoint
 * The client sends { path, referrer } in the request body.
 * The middleware extracts IP/UA from the server side (cannot be spoofed by client).
 */
function trackPageViewPost(req, res, next) {
    setImmediate(() => {
        try {
            const ip = getClientIp(req);
            const ua = req.headers['user-agent'] || '';
            const referrer = req.body?.referrer || req.headers['referer'] || null;
            const path = req.body?.path || '/';
            const country = getCountry(ip);
            const deviceType = detectDevice(ua);
            const visitorHash = hashVisitor(ip, ua);

            prisma.pageView.create({
                data: {
                    path: path.slice(0, 500),
                    referrer: referrer ? referrer.slice(0, 500) : null,
                    country,
                    deviceType,
                    visitorHash,
                },
            }).catch(() => {});
        } catch {}
    });

    // Respond immediately
    res.status(204).end();
}

module.exports = { trackPageView, trackPageViewPost };
