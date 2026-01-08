import { useQuery } from '@tanstack/react-query';
import { apiService } from '../../helpers/apiService';
import { useAuth } from '../../helpers/authStore';

// Keys for query caching
export const dashboardKeys = {
    all: ['dashboard'] as const,
    upcomingEvents: () => [...dashboardKeys.all, 'upcomingEvents'] as const,
    openTasks: () => [...dashboardKeys.all, 'openTasks'] as const,
};

// Mock data until real endpoints are ready
const MOCK_TASKS = [
    { id: '1', title: 'Noten sortieren', dueDate: '2026-02-15', status: 'Open' },
    { id: '2', title: 'Anmeldung Generalversammlung', dueDate: '2026-03-01', status: 'Open' },
];

export function useDashboardHelper() {
    const { user } = useAuth();

    // Fetch upcoming events
    // Ideally, we would have an endpoint specifically for "My Upcoming Events"
    // For now, we'll fetch all events and filter for future dates
    const { data: upcomingEvents, isLoading: isLoadingEvents } = useQuery({
        queryKey: dashboardKeys.upcomingEvents(),
        queryFn: async () => {
            // Assuming apiService has a method to get events. 
            // If not, we fall back to a mock or available endpoint.
            // Based on previous context, apiService.events() exists but might be public events.
            try {
                // Using generic events endpoint for now. 
                // In a real scenario, this should be `apiService.myEvents()`
                const allEvents = await apiService.events();

                // Filter and sort client-side
                const now = new Date();
                return allEvents
                    .filter((e: any) => new Date(e.startTime) > now)
                    .sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                    .slice(0, 3); // Take next 3
            } catch (error) {
                console.warn('Failed to fetch events for dashboard', error);
                return [];
            }
        },
    });

    const { data: tasks, isLoading: isLoadingTasks } = useQuery({
        queryKey: dashboardKeys.openTasks(),
        queryFn: async () => {
            // Mock delay
            await new Promise(resolve => setTimeout(resolve, 500));
            return MOCK_TASKS;
        }
    });

    return {
        user,
        upcomingEvents: upcomingEvents || [],
        tasks: tasks || [],
        isLoading: isLoadingEvents || isLoadingTasks,
    };
}
