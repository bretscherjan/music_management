import api from '@/lib/api';
import type { Register, CreateRegisterDto, UpdateRegisterDto } from '@/types';

export const registerService = {
    async getAll(): Promise<Register[]> {
        const response = await api.get<{ registers: Register[] }>('/registers');
        return response.data.registers;
    },

    async getById(id: number): Promise<Register> {
        const response = await api.get<{ register: Register }>(`/registers/${id}`);
        return response.data.register;
    },

    async create(data: CreateRegisterDto): Promise<Register> {
        const response = await api.post<{ register: Register }>('/registers', data);
        return response.data.register;
    },

    async update(id: number, data: UpdateRegisterDto): Promise<Register> {
        const response = await api.put<{ register: Register }>(`/registers/${id}`, data);
        return response.data.register;
    },

    async delete(id: number): Promise<void> {
        await api.delete(`/registers/${id}`);
    },
};

export default registerService;
