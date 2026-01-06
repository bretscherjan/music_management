import { EventService } from '../services/EventService';
import type { EventDto } from '../api/web-api-client';

export const EventHelper = {
    loadEvents: async (
        setEvents: (data: EventDto[]) => void,
        setIsLoading: (loading: boolean) => void,
        setError?: (msg: string) => void
    ) => {
        setIsLoading(true);
        try {
            const data = await EventService.getAll(true);
            setEvents(data);
        } catch (error) {
            console.error("Helper: Failed to load events", error);
            if (setError) setError("Konnte Termine nicht laden.");

            // Mock Fallback
            const mock1 = { id: 1, title: "Musikprobe", location: "Mehrzweckhalle", startTime: new Date(Date.now() + 86400000), type: "Rehearsal" } as EventDto;

            const mock2 = { id: 2, title: "Jubiläumskonzert", location: "Kirche Elgg", startTime: new Date(Date.now() + 86400000 * 7), type: "Concert" } as EventDto;

            setEvents([mock1, mock2]);
        } finally {
            setIsLoading(false);
        }
    },

    vote: async (
        id: number,
        status: string,
        // Optional: refresh callback
    ) => {
        try {
            await EventService.setAttendance(id, status);
            // In a real app, we might update local state or re-fetch
            return true;
        } catch (error) {
            console.error("Helper: Vote failed", error);
            alert("Fehler beim Abstimmen.");
            return false;
        }
    },

    // Formatting Helpers
    formatDate: (date?: Date) => {
        if (!date) return '';
        return new Date(date).toLocaleDateString('de-CH', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
    },

    formatTime: (date?: Date) => {
        if (!date) return '';
        return new Date(date).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' });
    }
};
