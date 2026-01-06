
import { Client, type UserDetailDto } from '../api/web-api-client';

const client = new Client("");

export const MemberService = {
    getAll: async (): Promise<UserDetailDto[]> => {
        return await client.usersAll();
    },

    getById: async (id: number): Promise<UserDetailDto> => {
        return await client.users(id);
    }
};
