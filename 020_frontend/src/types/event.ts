// Event Types - mirrors Prisma Event model

export type EventCategory = 'rehearsal' | 'performance' | 'other';
export type EventVisibility = 'all' | 'register' | 'admin';

export interface Event {
    id: number;
    title: string;
    description?: string | null;
    location?: string | null;
    category: EventCategory;
    visibility: EventVisibility;
    date: string; // ISO date string
    startTime: string; // Format: "HH:mm"
    endTime: string; // Format: "HH:mm"
    responseDeadlineHours: number; // Hours before event start (e.g., 48 = 2 days)
    isRecurring: boolean;
    recurrenceRule?: string | null;
    excludedDates?: string[] | null;
    createdAt: string;
    updatedAt: string;
    setlist?: EventSetlistItem[];
}

// Setlist item types
export type SetlistItemType = 'sheetMusic' | 'pause' | 'custom';

export interface EventSetlistItem {
    id: number;
    eventId: number;
    type: SetlistItemType;
    position: number;

    // Sheet music
    sheetMusicId?: number;
    sheetMusic?: import('./sheetMusic').SheetMusic;

    // Custom/Pause
    customTitle?: string;
    customDescription?: string;
    duration?: number; // minutes

    createdAt: string;
}

export interface AddSetlistItemDto {
    type: SetlistItemType;
    sheetMusicId?: number;
    customTitle?: string;
    customDescription?: string;
    duration?: number;
}

export interface UpdateSetlistItemDto {
    customTitle?: string;
    customDescription?: string;
    duration?: number;
}

export interface ReorderSetlistDto {
    items: Array<{ id: number; position: number }>;
}

// DTOs for API operations
export interface CreateEventDto {
    title: string;
    description?: string;
    location?: string;
    category: EventCategory;
    visibility?: EventVisibility;
    date: string;
    startTime: string;
    endTime: string;
    responseDeadlineHours?: number;
    isRecurring?: boolean;
    recurrenceRule?: string;
}

export interface UpdateEventDto {
    title?: string;
    description?: string;
    location?: string;
    category?: EventCategory;
    visibility?: EventVisibility;
    date?: string;
    startTime?: string;
    endTime?: string;
    responseDeadlineHours?: number;
    isRecurring?: boolean;
    recurrenceRule?: string;
}

export interface EventQueryParams {
    startDate?: string;
    endDate?: string;
    category?: EventCategory;
    expand?: boolean; // Expand recurring events
}
