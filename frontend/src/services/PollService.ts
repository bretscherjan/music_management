
import { Client, type Poll, type CreatePollDto, type VoteDto } from '../api/web-api-client';

const client = new Client("");

export const PollService = {
    getAll: async (): Promise<Poll[]> => {
        return await client.pollsAll();
    },

    createPoll: async (title: string, description: string, dueDate: Date, isActive: boolean, options: string[]): Promise<Poll> => {
        const dto = { title, description, dueDate, isActive, options } as CreatePollDto;
        return await client.polls(dto); // POST
    },

    vote: async (pollId: number, optionId: number): Promise<void> => {
        const dto = { optionId } as VoteDto;
        await client.vote(pollId, dto);
    }
};
