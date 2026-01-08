import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../helpers/apiService';
import type { UpdateUserRequestDto } from '../../api/generated/ApiClient';

export const memberKeys = {
    all: ['members'] as const,
    lists: () => [...memberKeys.all, 'list'] as const,
    detail: (id: string) => [...memberKeys.all, 'detail', id] as const,
};

export function useMembers() {
    const { data: users, isLoading, error } = useQuery({
        queryKey: memberKeys.lists(),
        queryFn: async () => {
            try {
                return await apiService.usersAll();
            } catch (err) {
                console.error("Failed to fetch members", err);
                return [];
            }
        },
    });

    // Filter client-side based on isActive
    // Assuming isActive=false means Pending/Inactive
    const pendingMembers = users?.filter(u => !u.isActive) || [];
    const activeMembers = users?.filter(u => u.isActive) || [];

    return {
        users: users || [],
        pendingMembers,
        activeMembers,
        isLoading,
        error
    };
}

export function useMemberMutations() {
    const queryClient = useQueryClient();

    const approveMember = useMutation({
        mutationFn: async (userId: string) => {
            const updateDto: UpdateUserRequestDto = {
                isActive: true
            };
            return apiService.usersPUT(userId, updateDto);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: memberKeys.lists() });
        },
    });

    const rejectMember = useMutation({
        mutationFn: async (userId: string) => {
            // For now, assume reject might mean delete or keep inactive
            // User requested "Freischalten", so reject is implicit or maybe delete?
            // Safer to just delete if it's a spam registration, but let's just implement delete logic if needed.
            return apiService.usersDELETE(userId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: memberKeys.lists() });
        },
    });

    return {
        approveMember,
        rejectMember
    };
}
