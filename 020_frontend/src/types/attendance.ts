// Attendance Types - mirrors Prisma Attendance model

import type { User } from './user';

export type AttendanceStatus = 'yes' | 'no' | 'maybe';

export interface Attendance {
    id: number | null; // null for pending members
    status: AttendanceStatus | null; // null = keine Rückmeldung
    comment?: string | null;
    eventId: number;
    userId: number;
    user?: User;
    createdAt: string | null;
    updatedAt: string | null;
}

// DTOs for API operations
export interface SetAttendanceDto {
    status: AttendanceStatus;
    comment?: string;
    userId?: number; // Optional: For admins/register-leaders setting attendance for others
}

// Grouped attendance for display
export interface AttendanceByRegister {
    registerId: number | null;
    registerName: string;
    attendances: Attendance[];
}

// API response for event attendances
export interface AttendancesResponse {
    attendances: Attendance[];
    grouped: {
        yes: Attendance[];
        no: Attendance[];
        maybe: Attendance[];
        pending: Attendance[];
    };
    summary: {
        yes: number;
        no: number;
        maybe: number;
        pending: number;
        total: number;
    };
    responseDeadlineHours: number;
    responseDeadline: string; // Calculated ISO string for convenience
    isResponseLocked?: boolean; // Server-side calculated locking status
}

// ==========================================
// Verified Attendance Types
// ==========================================

export type VerificationStatus = 'PRESENT' | 'EXCUSED' | 'UNEXCUSED';

export interface VerifiedAttendance {
    id: number;
    eventId: number;
    userId: number;
    status: VerificationStatus;
    comment?: string | null;
    updatedAt: string;
    adminId: number;
}

export interface VerificationListItem {
    user: User;
    attendance: {
        status: AttendanceStatus;
        comment?: string | null;
    } | null;
    verified: {
        status: VerificationStatus;
        comment?: string | null;
        updatedAt: string;
    } | null;
    smartStatus: VerificationStatus | 'UNEXCUSED'; // Calculated fallback
}

export interface VerificationListResponse {
    event: {
        id: number;
        title: string;
        date: string;
    };
    list: VerificationListItem[];
    grouped: Record<string, VerificationListItem[]>;
}

export interface BulkVerifyDto {
    verifications: {
        userId: number;
        status: VerificationStatus;
        comment?: string;
    }[];
}
