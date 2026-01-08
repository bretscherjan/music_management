import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../helpers/apiService';
import type {
    CastVoteRequestDto,
    CreateSurveyRequestDto
} from '../../api/generated/ApiClient';

export const surveyKeys = {
    all: ['surveys'] as const,
    byEvent: (eventId: string) => [...surveyKeys.all, 'event', eventId] as const,
};

export function useSurveys(eventId: string) {
    return useQuery({
        queryKey: surveyKeys.byEvent(eventId),
        queryFn: () => apiService.byEvent2(eventId),
        enabled: !!eventId
    });
}

export function useSurveyMutations() {
    const queryClient = useQueryClient();

    const voteSurvey = useMutation({
        mutationFn: (data: CastVoteRequestDto) => apiService.voteSurvey(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: surveyKeys.all });
        }
    });

    const createSurvey = useMutation({
        mutationFn: (data: CreateSurveyRequestDto) => apiService.surveys(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: surveyKeys.all });
        }
    });

    return { voteSurvey, createSurvey };
}
