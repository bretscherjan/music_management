import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../helpers/apiService';
import { useAuth } from '../../helpers/authStore';
import type {
    EventResponseDto,
    CreateEventRequestDto,
    UpdateEventRequestDto,
    CheckInRequestDto
} from '../../api/generated/ApiClient';

// Query keys for caching
export const EVENT_KEYS = {
    all: ['events'] as const,
    lists: () => [...EVENT_KEYS.all, 'list'] as const,
    list: (filters: string) => [...EVENT_KEYS.lists(), { filters }] as const,
    details: () => [...EVENT_KEYS.all, 'detail'] as const,
    detail: (id: string) => [...EVENT_KEYS.details(), id] as const,
    upcoming: () => [...EVENT_KEYS.lists(), 'upcoming'] as const,
};

/**
 * Calculates availability for an event based on max participants and current registrations.
 * Also handles specific register logic if needed in the future.
 */
export const calculateAvailability = (event: EventResponseDto): {
    available: number;
    isFull: boolean;
    text: string
} => {
    if (!event.maxParticipants) {
        return { available: Infinity, isFull: false, text: 'Unlimited' };
    }

    const current = event.currentParticipants || 0;
    const available = Math.max(0, event.maxParticipants - current);
    const isFull = available === 0;

    return {
        available,
        isFull,
        text: isFull ? 'Ausgebucht' : `${available} Plätze frei`
    };
};

/**
 * Hook to fetch events with filtering logic based on user role.
 * - public: View only public events
 * - member: View published events (public + internal, but not drafts)
 * - admin: View all events including drafts
 */
export const useEvents = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'Admin';
    const isMember = user?.role === 'Member' || isAdmin;

    return useQuery({
        queryKey: EVENT_KEYS.lists(),
        queryFn: async () => {
            // In a real scenario, we might pass filters to the API.
            // For now, we fetch all and filter client-side or assume the API 
            // returns what we're allowed to see, but we implement the requested logic here.
            try {
                const events = await apiService.eventsAll();
                return events;
            } catch (error) {
                console.error('Failed to fetch events:', error);
                throw error;
            }
        },
        select: (events: EventResponseDto[]) => {
            if (!events) return [];

            return events.filter((event) => {
                // Admin sees everything
                if (isAdmin) return true;

                // Members see everything except drafts
                if (isMember) {
                    return !event.isDraft;
                }

                // Public sees only public events
                return event.isPublic && !event.isDraft;
            });
        },
    });
};

/**
 * Hook to fetch a single event by ID.
 */
export const useEvent = (id: string) => {
    return useQuery({
        queryKey: EVENT_KEYS.detail(id),
        queryFn: () => apiService.eventsGET(id),
        enabled: !!id,
    });
};

/**
 * Hook to fetch upcoming events.
 */
export const useUpcomingEvents = (count = 5) => {
    return useQuery({
        queryKey: [...EVENT_KEYS.upcoming(), count],
        queryFn: async () => {
            // Adapt to the actual API method signature. 
            // If the generated client expects 'upcoming' property on global scope or similar, check usage.
            // Based on previous file reads, apiService returns the singleton derived from ApiClient.
            // The method in the new NSwag client is `upcoming(count)`.
            return apiService.upcoming(count);
        }
    });
};

/**
 * Hook to create a new event (Admin only).
 */
export const useCreateEvent = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateEventRequestDto) => apiService.eventsPOST(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: EVENT_KEYS.lists() });
        },
    });
};

/**
 * Hook to update an event (Admin only).
 */
export const useUpdateEvent = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateEventRequestDto }) =>
            apiService.eventsPUT(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: EVENT_KEYS.lists() });
            queryClient.invalidateQueries({ queryKey: EVENT_KEYS.detail(variables.id) });
        },
    });
};

/**
 * Hook to delete an event (Admin only).
 */
export const useDeleteEvent = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => apiService.eventsDELETE(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: EVENT_KEYS.lists() });
        },
    });
};

/**
 * Hook for QR Code Check-in.
 */
export const useEventCheckIn = () => {
    return useMutation({
        mutationFn: ({ id, qrCode }: { id: string; qrCode: string }) =>
            apiService.checkin(id, { qrCode } as CheckInRequestDto),
    });
};
