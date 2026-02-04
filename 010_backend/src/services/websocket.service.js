/**
 * WebSocket Service for Admin Workspace
 * Provides real-time synchronization for tasks and notes
 */

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

let io = null;

/**
 * Initialize Socket.io server
 * @param {http.Server} httpServer - The HTTP server instance
 */
function initializeWebSocket(httpServer) {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.CORS_ORIGIN || '*',
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
                    role: true
                }
            });

            if (!user) {
                return next(new Error('User not found'));
            }

            if (user.role !== 'admin') {
                return next(new Error('Admin access required'));
            }

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
        socket.on('disconnect', () => {
            console.log(`🔌 Admin disconnected from workspace: ${socket.user.firstName} ${socket.user.lastName}`);
            socket.to('workspace').emit('user:left', {
                userId: socket.user.id
            });
        });
    });

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
 * Middleware to attach io to request
 */
function attachIO(req, res, next) {
    req.io = io;
    next();
}

module.exports = {
    initializeWebSocket,
    getIO,
    attachIO
};
