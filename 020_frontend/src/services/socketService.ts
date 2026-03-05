import { io, Socket } from 'socket.io-client';
import type { Task, AdminNote, CursorPosition, SocketUser } from '@/types/workspace';

type SocketEventCallback<T> = (data: T) => void;

class SocketService {
    private socket: Socket | null = null;
    private listeners: Map<string, Set<SocketEventCallback<unknown>>> = new Map();
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private heartbeatInterval: number | null = null;
    private readonly handleVisibilityChange = () => {
        if (document.visibilityState === 'hidden') {
            // Tab went to background / window minimized → stop heartbeat and signal away
            this.stopHeartbeat();
            if (this.socket?.connected) {
                this.socket.emit('user:away');
            }
        } else if (document.visibilityState === 'visible') {
            // Tab became active again → signal back online immediately
            if (this.socket?.connected) {
                this.socket.emit('user:heartbeat', { timestamp: Date.now() });
            }
            this.startHeartbeat();
        }
    };

    /**
     * Connect to the WebSocket server
     */
    connect(token: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.socket?.connected) {
                resolve();
                return;
            }

            const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3004';

            this.socket = io(baseUrl, {
                path: '/ws',
                auth: { token },
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionAttempts: this.maxReconnectAttempts,
                reconnectionDelay: 1000,
            });

            this.socket.on('connect', () => {
                this.reconnectAttempts = 0;
                this.startHeartbeat();
                document.addEventListener('visibilitychange', this.handleVisibilityChange);
                resolve();
            });

            this.socket.on('connect_error', (error) => {
                console.error('🔌 Connection error:', error.message);
                this.reconnectAttempts++;
                if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                    reject(error);
                }
            });

            this.socket.on('disconnect', () => {
                this.stopHeartbeat();
            });

            // Set up event forwarding
            this.setupEventForwarding();
        });
    }

    /**
     * Disconnect from the WebSocket server
     */
    disconnect(): void {
        this.stopHeartbeat();
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.listeners.clear();
    }

    /**
     * Start sending heartbeat every 60 seconds
     */
    private startHeartbeat(): void {
        if (this.heartbeatInterval !== null) return;
        this.heartbeatInterval = window.setInterval(() => {
            if (this.socket?.connected) {
                this.socket.emit('user:heartbeat', { timestamp: Date.now() });
            }
        }, 30_000) as unknown as number; // 30 seconds
    }

    /**
     * Stop sending heartbeat
     */
    private stopHeartbeat(): void {
        if (this.heartbeatInterval !== null) {
            window.clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    /**
     * Check if connected
     */
    isConnected(): boolean {
        return this.socket?.connected ?? false;
    }

    /**
     * Set up event forwarding from socket to listeners
     */
    private setupEventForwarding(): void {
        if (!this.socket) return;

        // Task events
        const taskEvents = [
            'task:created',
            'task:updated',
            'task:completed',
            'task:archived',
            'task:deleted',
            'tasks:reordered',
        ];

        taskEvents.forEach((event) => {
            this.socket?.on(event, (data) => {
                this.emit(event, data);
            });
        });

        // Category events
        const categoryEvents = ['category:created', 'category:updated', 'category:deleted'];
        categoryEvents.forEach((event) => {
            this.socket?.on(event, (data) => {
                this.emit(event, data);
            });
        });

        // Note events
        const noteEvents = ['note:created', 'note:updated', 'note:deleted', 'note:pinned', 'note:synced'];
        noteEvents.forEach((event) => {
            this.socket?.on(event, (data) => {
                this.emit(event, data);
            });
        });

        // User events
        this.socket.on('user:joined', (data) => this.emit('user:joined', data));
        this.socket.on('user:left', (data) => this.emit('user:left', data));

        // Online presence events (real-time analytics)
        this.socket.on('online:joined', (data) => this.emit('online:joined', data));
        this.socket.on('online:left', (data) => this.emit('online:left', data));
        this.socket.on('online:list', (data) => this.emit('online:list', data));

        // System log live-feed (admin dashboard)
        this.socket.on('log:entry', (data) => this.emit('log:entry', data));

        // Cursor events
        this.socket.on('cursor:update', (data) => this.emit('cursor:update', data));

        // Typing events
        this.socket.on('typing:started', (data) => this.emit('typing:started', data));
        this.socket.on('typing:stopped', (data) => this.emit('typing:stopped', data));
    }

    /**
     * Emit event to local listeners
     */
    private emit(event: string, data: unknown): void {
        const eventListeners = this.listeners.get(event);
        if (eventListeners) {
            eventListeners.forEach((callback) => callback(data));
        }
    }

    /**
     * Subscribe to an event
     */
    on<T>(event: string, callback: SocketEventCallback<T>): () => void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(callback as SocketEventCallback<unknown>);

        // Return unsubscribe function
        return () => {
            this.listeners.get(event)?.delete(callback as SocketEventCallback<unknown>);
        };
    }

    /**
     * Request the current online users list from the server
     */
    requestOnlineList(): void {
        if (this.socket?.connected) {
            this.socket.emit('get:online-list');
        }
    }

    /**
     * Send cursor position
     */
    sendCursorPosition(noteId: number, position: number, selection?: { start: number; end: number }): void {
        this.socket?.emit('cursor:move', { noteId, position, selection });
    }

    /**
     * Send note content sync
     */
    syncNoteContent(noteId: number, content: string): void {
        this.socket?.emit('note:sync', { noteId, content });
    }

    /**
     * Start typing indicator
     */
    startTyping(noteId: number): void {
        this.socket?.emit('typing:start', { noteId });
    }

    /**
     * Stop typing indicator
     */
    stopTyping(noteId: number): void {
        this.socket?.emit('typing:stop', { noteId });
    }
}

// Singleton instance
const socketService = new SocketService();

export default socketService;

// Type exports for event handlers
export type TaskCreatedEvent = Task;
export type TaskUpdatedEvent = Task;
export type TaskCompletedEvent = Task;
export type TaskArchivedEvent = { id: number; archived: boolean };
export type TaskDeletedEvent = { id: number };
export type TasksReorderedEvent = Array<{ id: number; position: number; categoryId?: number; parentId?: number | null }>;

export type NoteCreatedEvent = AdminNote;
export type NoteUpdatedEvent = { id: number; title?: string; pinned?: boolean; userId: number };
export type NoteDeletedEvent = { id: number };
export type NotePinnedEvent = { id: number; pinned: boolean };
export type NoteSyncedEvent = { userId: number; noteId: number; content: string };

export type UserJoinedEvent = SocketUser;
export type UserLeftEvent = { userId: number };
export type OnlineJoinedEvent = { userId: number; firstName: string; lastName: string; role: string; register: string | null };
export type OnlineLeftEvent = { userId: number };
export type OnlineListEvent = { users: Array<{ userId: number; firstName: string; lastName: string; role: string; register: string | null; lastSeen: string }> };
export type CursorUpdateEvent = CursorPosition;
export type TypingEvent = { userId: number; firstName: string; noteId: number };
