import { useState, useEffect } from 'react';
import { apiService } from './apiService';
import type { EventResponseDto } from '../api/generated/ApiClient';

export const useEventsHelper = (includeDrafts = false, includeCancelled = false) => {
    const [events, setEvents] = useState<EventResponseDto[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadEvents();
    }, [includeDrafts, includeCancelled]);

    const loadEvents = async () => {
        setLoading(true);
        try {
            // Manual fetch to support query parameters which NSwag missed
            const token = localStorage.getItem('jwt');
            const query = new URLSearchParams();
            if (includeDrafts) query.append('includeDrafts', 'true');
            if (includeCancelled) query.append('includeCancelled', 'true');

            // Use fetch directly
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5141'}/api/Events?${query.toString()}`, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch events');
            const data: EventResponseDto[] = await response.json();

            // Sort by date asc for calendar
            setEvents(data.sort((a: EventResponseDto, b: EventResponseDto) =>
                new Date(a.startTime || 0).getTime() - new Date(b.startTime || 0).getTime()
            ));
        } catch (error) {
            console.error("Failed to load events", error);
        } finally {
            setLoading(false);
        }
    };

    const checkIn = async (eventId: string, qrCode: string) => {
        try {
            await apiService.checkin(eventId, { qrCode });
            return true;
        } catch (error) {
            console.error("Check-in failed", error);
            throw error;
        }
    };

    const respondToEvent = async (eventId: string, accept: boolean) => {
        // TODO: Implement actual RSVP endpoint when available
        console.log(`RSVP ${accept ? 'accepted' : 'declined'} for event ${eventId}`);
        // For now, just log - API endpoint for RSVP would be called here
        return true;
    };

    return {
        events,
        loading,
        checkIn,
        respondToEvent,
        reload: loadEvents
    };
};
