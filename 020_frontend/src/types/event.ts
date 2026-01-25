import type { Attendance, AttendanceStatus } from './attendance';
import type { SheetMusic } from './sheetMusic';

export type EventCategory = 'rehearsal' | 'performance' | 'other';
export type EventVisibility = 'all' | 'register' | 'admin';

export interface Event {
    id: number;
    title: string;
    description?: string | null;
    location?: string | null;
    category: EventCategory;
    visibility: EventVisibility;
    isPublic: boolean;
    targetRegisters?: { id: number; name: string }[];
    date: string; // ISO date string
    startTime: string; // Format: "HH:mm"
    endTime: string; // Format: "HH:mm"
    responseDeadlineHours: number; // Hours before event start (e.g., 48 = 2 days)
    isRecurring: boolean;
    recurrenceRule?: string | null;
    excludedDates?: string[] | null;
    createdAt: string;
    updatedAt: string;
    setlistEnabled: boolean;
    setlist?: EventSetlistItem[];
    attendances?: Attendance[]; // List of attendances (usually just current user's or all depending on context)
    attendanceSummary?: {
        yes: number;
        no: number;
        maybe: number;
        pending: number;
        total: number;
    };
}

// Setlist Types
// Setlist Types
export type SetlistItemType = 'sheetMusic' | 'pause' | 'custom';

export interface EventSetlistItem {
    id: number;
    eventId: number;
    type: SetlistItemType;
    position: number;
    sheetMusicId?: number | null;
    customTitle?: string | null;
    customDescription?: string | null;
    duration?: number | null; // Changed from customDurationMinutes to match backend
    sheetMusic?: SheetMusic | null;
    createdAt: string;
    updatedAt: string;
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
    setlistEnabled?: boolean;
    isPublic?: boolean;
    targetRegisters?: number[];
    reminderIntervals?: number[];
    defaultAttendanceStatus?: AttendanceStatus | 'none';
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
    setlistEnabled?: boolean;
    isPublic?: boolean;
    targetRegisters?: number[];
    reminderIntervals?: number[];
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
    items: {
        id: number;
        position: number;
    }[];
}

export interface EventQueryParams {
    startDate?: string;
    endDate?: string;
    category?: EventCategory;
    expand?: boolean; // Expand recurring events
}
