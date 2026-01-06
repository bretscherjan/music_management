import { Client, type CreateRoleRequestDto, type RoleChangeRequestDto } from '../api/web-api-client';

const client = new Client("");

export const GovernanceService = {
    getAllRequests: async (): Promise<RoleChangeRequestDto[]> => {
        return await client.requestsAll();
    },

    createRequest: async (targetUserId: number, newRole: string): Promise<RoleChangeRequestDto> => {
        const dto = { targetUserId, newRole } as CreateRoleRequestDto;
        return await client.requests(dto);
    },

    approveRequest: async (requestId: number): Promise<void> => {
        await client.approve(requestId);
    }
};
