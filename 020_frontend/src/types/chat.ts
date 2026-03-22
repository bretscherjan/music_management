export type ChatType = 'direct' | 'group';
export type ChatRole = 'owner' | 'member';

export interface ChatParticipant {
    id: number;
    chatId: number;
    userId: number;
    role: ChatRole;
    joinedAt: string;
    muted: boolean;
    canManageMembers: boolean;
    user: {
        id: number;
        firstName: string;
        lastName: string;
        profilePicture: string | null;
    };
}

export interface ChatReadState {
    id: number;
    chatId: number;
    userId: number;
    lastReadSequence: number;
    unreadCount: number;
}

export interface Chat {
    id: number;
    type: ChatType;
    title: string | null;
    createdBy: number;
    createdAt: string;
    updatedAt: string;
    lastMessageAt: string | null;
    lastMessagePreview: string | null;
    archivedAt: string | null;
    participants: ChatParticipant[];
    readStates: ChatReadState[];
}

export interface ChatMessage {
    id: string; // UUID from file
    indexId: number; // ID from MySQL index
    chatId: number;
    senderId: number;
    text: string;
    type: string;
    createdAt: string;
    editedAt: string | null;
    deletedAt: string | null;
    metadata?: any;
    replyToId?: string;
    replyToText?: string;
    reactions?: any[];
}

export interface TypingEvent {
    chatId: number;
    userId: number;
    firstName: string;
}
