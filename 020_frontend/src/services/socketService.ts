import { io, Socket } from 'socket.io-client';
import type { Task, AdminNote, CursorPosition, SocketUser } from '@/types/workspace';

type SocketEventCallback<T> = (data: T) => void;

class SocketService {
    private socket: Socket | null = null;
    private listeners: Map<string, Set<SocketEventCallback<unknown>>> = new Map();
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;

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
                // disconnected
            });

            // Set up event forwarding
            this.setupEventForwarding();
        });
    }

    /**
     * Disconnect from the WebSocket server
     */
    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.listeners.clear();
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
export type CursorUpdateEvent = CursorPosition;
export type TypingEvent = { userId: number; firstName: string; noteId: number };
