import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../helpers/apiService';
import type {
    CheckInQrRequestDto
} from '../../api/generated/ApiClient';

export const attendanceKeys = {
    all: ['attendance'] as const,
    event: (eventId: string) => [...attendanceKeys.all, 'event', eventId] as const,
    stats: (year: number) => [...attendanceKeys.all, 'stats', year] as const,
    token: (eventId: string) => [...attendanceKeys.all, 'token', eventId] as const,
};

export function useEventAttendance(eventId: string) {
    return useQuery({
        queryKey: attendanceKeys.event(eventId),
        queryFn: () => apiService.eventAll(eventId),
        enabled: !!eventId
    });
}

export function useAttendanceStats(year: number) {
    return useQuery({
        queryKey: attendanceKeys.stats(year),
        queryFn: () => apiService.getStatistics(year),
    });
}

export function useQrToken(eventId: string) {
    return useQuery({
        queryKey: attendanceKeys.token(eventId),
        queryFn: () => apiService.token(eventId),
        enabled: !!eventId,
        staleTime: 1000 * 60 * 55, // Cached for 55 mins (token usually valid for 60)
    });
}

export function useAttendanceMutations() {
    const queryClient = useQueryClient();

    const checkinQr = useMutation({
        mutationFn: (token: string) => {
            const req: CheckInQrRequestDto = { token };
            return apiService.checkinQr(req);
        },
        onSuccess: () => {
            // Invalidate relevant queries
            queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
            queryClient.invalidateQueries({ queryKey: ['events'] });
        }
    });

    return { checkinQr };
}
