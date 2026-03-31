import api from '@/lib/api';
import { publicApi } from '@/lib/api';
import { pdfOptsToParams, DEFAULT_PDF_OPTIONS, type PdfOptions } from '@/utils/pdfTheme';
import type {
    Event,
    CreateEventDto,
    UpdateEventDto,
    EventQueryParams,
    Attendance,
    SetAttendanceDto,
    AttendancesResponse,
    AddSetlistItemDto,
    UpdateSetlistItemDto,
    ReorderSetlistDto,
} from '@/types';

export const eventService = {
    async getAll(params?: EventQueryParams): Promise<Event[]> {
        const response = await api.get<{ events: Event[] }>('/events', { params });
        return response.data.events;
    },

    // Get only public events (for unauthenticated/public pages)
    async getPublicEvents(params?: EventQueryParams): Promise<Event[]> {
        const response = await publicApi.get<{ events: Event[] }>('/events', { params });
        return response.data.events;
    },

    async getById(id: number): Promise<Event> {
        const response = await api.get<{ event: Event }>(`/events/${id}`);
        return response.data.event;
    },

    async create(data: CreateEventDto): Promise<Event> {
        const response = await api.post<{ event: Event }>('/events', data);
        return response.data.event;
    },

    async update(id: number, data: UpdateEventDto): Promise<Event> {
        const response = await api.put<{ event: Event }>(`/events/${id}`, data);
        return response.data.event;
    },

    async delete(id: number): Promise<void> {
        await api.delete(`/events/${id}`);
    },

    async excludeDate(id: number, date: string): Promise<Event> {
        const response = await api.post<{ event: Event }>(`/events/${id}/exclude-date`, { date });
        return response.data.event;
    },

    // Attendance operations
    async setAttendance(eventId: number, data: SetAttendanceDto): Promise<Attendance> {
        const response = await api.post<{ attendance: Attendance }>(`/events/${eventId}/attendance`, data);
        return response.data.attendance;
    },

    async getAttendances(eventId: number): Promise<AttendancesResponse> {
        const response = await api.get<AttendancesResponse>(`/events/${eventId}/attendances`);
        return response.data;
    },

    async sendReminders(eventId: number): Promise<{ count: number }> {
        const response = await api.post<{ count: number }>(`/events/${eventId}/send-reminders`);
        return response.data;
    },

    async deleteMultiple(ids: number[]): Promise<{ count: number }> {
        const response = await api.post<{ count: number }>('/events/bulk-delete', { ids });
        return response.data;
    },

    // Setlist operations
    async addSetlistItem(eventId: number, data: AddSetlistItemDto): Promise<void> {
        await api.post(`/events/${eventId}/setlist`, data);
    },

    async updateSetlistItem(eventId: number, itemId: number, data: UpdateSetlistItemDto): Promise<void> {
        await api.put(`/events/${eventId}/setlist/${itemId}`, data);
    },

    async removeSetlistItem(eventId: number, itemId: number): Promise<void> {
        await api.delete(`/events/${eventId}/setlist/${itemId}`);
    },

    async reorderSetlist(eventId: number, data: ReorderSetlistDto): Promise<void> {
        await api.put(`/events/${eventId}/setlist/reorder`, data);
    },

    // Helper: Get upcoming events
    async getUpcoming(limit: number = 3): Promise<Event[]> {
        const today = new Date().toISOString().split('T')[0];
        const events = await this.getAll({ startDate: today, expand: true });
        return events
            .filter((e) => new Date(e.date) >= new Date(today))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(0, limit);
    },

    // Verification operations
    async getVerificationList(eventId: number): Promise<import('@/types').VerificationListResponse> {
        const response = await api.get<import('@/types').VerificationListResponse>(`/events/${eventId}/verification-list`);
        return response.data;
    },

    async verifyAttendance(eventId: number, data: import('@/types').BulkVerifyDto): Promise<{ message: string }> {
        const response = await api.post<{ message: string }>(`/events/${eventId}/verify`, data);
        return response.data;
    },

    async exportPdf(eventId: number, pdfOpts: PdfOptions = DEFAULT_PDF_OPTIONS): Promise<Blob> {
        const response = await api.get(`/events/${eventId}/export-pdf`, {
            params: pdfOptsToParams(pdfOpts),
            responseType: 'blob',
        });
        return response.data;
    },

    downloadBlob(blob: Blob, filename: string): void {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    },
};

export default eventService;
