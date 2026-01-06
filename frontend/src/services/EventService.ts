import { Client, type SetAttendanceDto, type AttendanceDto } from '../api/web-api-client';
import type { EventDto } from '../api/web-api-client';

const client = new Client("");

export const EventService = {
    getAll: async (futureOnly: boolean = true): Promise<EventDto[]> => {
        return await client.eventsAll(futureOnly);
    },

    setAttendance: async (id: number, status: string, comment: string = ""): Promise<void> => {
        const dto = { status, comment } as SetAttendanceDto;
        await client.setAttendance(id, dto);
    },

    getAttendance: async (id: number): Promise<AttendanceDto[]> => {
        return await client.eventsGetAttendance(id);
    }
};
