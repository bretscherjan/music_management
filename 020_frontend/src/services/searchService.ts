import api from '@/lib/api';

export type SearchCategory = 'all' | 'files' | 'folders' | 'events' | 'members';

export interface SearchFile {
    id: number;
    originalName: string;
    mimetype: string;
    visibility: string;
    folder: string;
    folderId: number | null;
    createdAt: string;
}

export interface SearchFolder {
    id: number;
    name: string;
    parentId: number | null;
    createdAt: string;
}

export interface SearchEvent {
    id: number;
    title: string;
    date: string;
    startTime: string;
    category: string;
    location: string | null;
    visibility: string;
}

export interface SearchMember {
    id: number;
    firstName: string;
    lastName: string;
    profilePicture: string | null;
    role: string;
    status: string;
    register: { id: number; name: string } | null;
}

export interface SearchResults {
    files: SearchFile[];
    folders: SearchFolder[];
    events: SearchEvent[];
    members: SearchMember[];
}

export const searchService = {
    async search(query: string, category: SearchCategory = 'all'): Promise<SearchResults> {
        const response = await api.get<SearchResults>('/search', {
            params: { q: query, category },
        });
        return response.data;
    },
};

export default searchService;
