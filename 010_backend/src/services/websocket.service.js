/**
 * WebSocket Service for Admin Workspace
 * Provides real-time synchronization for tasks and notes
 */

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

let io = null;

// In-memory presence tracking: { userId: { id, firstName, lastName, role, register, lastHeartbeat } }
const onlineUsers = new Map();
const HEARTBEAT_TIMEOUT = 2 * 60 * 1000; // 2 minutes
const CLEANUP_INTERVAL = 30 * 1000; // Check every 30 seconds

/**
 * Initialize Socket.io server
 * @param {http.Server} httpServer - The HTTP server instance
 */
function initializeWebSocket(httpServer) {
    const corsOrigins = (process.env.CORS_ORIGIN || '')
        .split(',')
        .map(origin => origin.trim())
        .filter(Boolean);

    io = new Server(httpServer, {
        cors: {
            origin: corsOrigins.length ? corsOrigins : '*',
            methods: ['GET', 'POST'],
            credentials: true
        },
        path: '/ws'
    });

    // Authentication middleware
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');

            if (!token) {
                return next(new Error('Authentication required'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await prisma.user.findUnique({
                where: { id: decoded.userId },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    registerId: true,
                    register: { select: { name: true } },
                }
            });

            if (!user) {
                return next(new Error('User not found'));
            }

            // Allow all authenticated users (removed admin-only check)
            // Users can join 'workspace' for collaborative editing, and heartbeat tracking
            socket.user = user;
            next();
        } catch (error) {
            next(new Error('Invalid token'));
        }
    });

    // Connection handler
    io.on('connection', (socket) => {
        console.log(`🔌 Admin connected to workspace: ${socket.user.firstName} ${socket.user.lastName}`);

        // Join the workspace room
        socket.join('workspace');

        // ── Presence Tracking (for analytics dashboard) ──
        // Add user to online list
        onlineUsers.set(socket.user.id, {
            id: socket.user.id,
            firstName: socket.user.firstName,
            lastName: socket.user.lastName,
            role: socket.user.role,
            register: socket.user.register?.name ?? null,
            lastHeartbeat: Date.now(),
            socketId: socket.id,
        });

        // Send the current online list to the newly connected socket
        const currentOnlineList = Array.from(onlineUsers.values()).map(u => ({
            userId: u.id,
            firstName: u.firstName,
            lastName: u.lastName,
            role: u.role,
            register: u.register,
            lastSeen: new Date(u.lastHeartbeat).toISOString(),
        }));
        socket.emit('online:list', { users: currentOnlineList });

        // Broadcast update to all others in the workspace
        socket.to('workspace').emit('online:joined', {
            userId: socket.user.id,
            firstName: socket.user.firstName,
            lastName: socket.user.lastName,
            role: socket.user.role,
            register: socket.user.register?.name ?? null,
        });

        // Handle heartbeat from regular users (not just admin workspace)
        socket.on('user:heartbeat', (data) => {
            const wasOffline = !onlineUsers.has(socket.user.id);
            if (onlineUsers.has(socket.user.id)) {
                onlineUsers.get(socket.user.id).lastHeartbeat = Date.now();
            } else {
                onlineUsers.set(socket.user.id, {
                    id: socket.user.id,
                    firstName: socket.user.firstName,
                    lastName: socket.user.lastName,
                    role: socket.user.role,
                    register: socket.user.register?.name ?? null,
                    lastHeartbeat: Date.now(),
                    socketId: socket.id,
                });
            }
            // If user was away (removed from map), broadcast re-join to others
            if (wasOffline) {
                socket.to('workspace').emit('online:joined', {
                    userId: socket.user.id,
                    firstName: socket.user.firstName,
                    lastName: socket.user.lastName,
                    role: socket.user.role,
                    register: socket.user.register?.name ?? null,
                });
            }
        });

        // Handle user going away (tab hidden / window minimized)
        socket.on('user:away', async () => {
            if (onlineUsers.has(socket.user.id)) {
                onlineUsers.delete(socket.user.id);
                
                // Persist lastSeenAt to database
                try {
                    await prisma.user.update({
                        where: { id: socket.user.id },
                        data: { lastSeenAt: new Date() }
                    });
                    console.log(`💾 lastSeenAt updated for user ${socket.user.id}`);
                } catch (err) {
                    console.error(`Failed to update lastSeenAt: ${err.message}`);
                }
                
                socket.to('workspace').emit('online:left', { userId: socket.user.id });
            }
        });

        // Handle request for current online list (e.g., when analytics page opens)
        socket.on('get:online-list', () => {
            const list = Array.from(onlineUsers.values()).map(u => ({
                userId: u.id,
                firstName: u.firstName,
                lastName: u.lastName,
                role: u.role,
                register: u.register,
                lastSeen: new Date(u.lastHeartbeat).toISOString(),
            }));
            socket.emit('online:list', { users: list });
        });

        // Notify others about new user
        socket.to('workspace').emit('user:joined', {
            userId: socket.user.id,
            firstName: socket.user.firstName,
            lastName: socket.user.lastName
        });

        // Handle cursor position updates for collaborative editing
        socket.on('cursor:move', (data) => {
            socket.to('workspace').emit('cursor:update', {
                userId: socket.user.id,
                firstName: socket.user.firstName,
                lastName: socket.user.lastName,
                ...data
            });
        });

        // Handle note content sync (for real-time collaboration)
        socket.on('note:sync', (data) => {
            socket.to('workspace').emit('note:synced', {
                userId: socket.user.id,
                ...data
            });
        });

        // Handle typing indicators
        socket.on('typing:start', (data) => {
            socket.to('workspace').emit('typing:started', {
                userId: socket.user.id,
                firstName: socket.user.firstName,
                ...data
            });
        });

        socket.on('typing:stop', (data) => {
            socket.to('workspace').emit('typing:stopped', {
                userId: socket.user.id,
                ...data
            });
        });

        // Handle disconnection
        socket.on('disconnect', async () => {
            console.log(`🔌 Admin disconnected from workspace: ${socket.user.firstName} ${socket.user.lastName}`);
            
            // Only update if user was still online
            if (onlineUsers.has(socket.user.id)) {
                onlineUsers.delete(socket.user.id);
                
                // Persist lastSeenAt to database
                try {
                    await prisma.user.update({
                        where: { id: socket.user.id },
                        data: { lastSeenAt: new Date() }
                    });
                    console.log(`💾 lastSeenAt updated for user ${socket.user.id} on disconnect`);
                } catch (err) {
                    console.error(`Failed to update lastSeenAt on disconnect: ${err.message}`);
                }
            }
            
            socket.to('workspace').emit('user:left', {
                userId: socket.user.id
            });
            socket.to('workspace').emit('online:left', {
                userId: socket.user.id
            });
        });
    });

    // ── Cleanup inactive users every 30 seconds ──
    const cleanupInterval = setInterval(async () => {
        const now = Date.now();
        for (const [userId, userInfo] of onlineUsers.entries()) {
            if (now - userInfo.lastHeartbeat > HEARTBEAT_TIMEOUT) {
                console.log(`⏰ User ${userId} timed out (inactive for 2+ min)`);
                onlineUsers.delete(userId);
                
                // Persist lastSeenAt to database
                try {
                    await prisma.user.update({
                        where: { id: userId },
                        data: { lastSeenAt: new Date() }
                    });
                    console.log(`💾 lastSeenAt updated for user ${userId} on heartbeat timeout`);
                } catch (err) {
                    console.error(`Failed to update lastSeenAt on timeout: ${err.message}`);
                }
                
                io.to('workspace').emit('online:left', { userId });
                // Also notify via socket if it's still connected
                if (io.sockets.sockets.get(userInfo.socketId)) {
                    io.sockets.sockets.get(userInfo.socketId).leave('workspace');
                }
            }
        }
    }, CLEANUP_INTERVAL);

    console.log('✅ WebSocket server initialized');

    return io;
}

/**
 * Get the Socket.io instance
 * @returns {Server|null}
 */
function getIO() {
    return io;
}

/**
 * Get list of currently online users
 * @returns {Array}
 */
function getOnlineUsersList() {
    return Array.from(onlineUsers.values()).map(u => ({
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        register: u.register,
        lastSeen: new Date(u.lastHeartbeat),
    }));
}

/**
 * Middleware to attach io to request
 */
function attachIO(req, res, next) {
    req.io = io;
    next();
}

module.exports = {
    initializeWebSocket,
    getIO,
    getOnlineUsersList,
    attachIO
};
