import api from '@/lib/api';

export interface Sponsor {
    id: number;
    name: string;
    description?: string;
    logoUrl: string;
    websiteUrl?: string;
    active: boolean;
    position: number;
}


export interface GalleryImage {
    id: number;
    filename: string;
    title?: string;
    description?: string;
    category?: string;
    active: boolean;
    position: number;
    createdAt: string;
}

export interface Flyer {
    id: number;
    filename: string;
    title: string;
    description?: string;
    activeFrom?: string;
    activeTo?: string;
    active: boolean;
    showOnHomePage: boolean;
    position: number;
    createdAt: string;
}

export const cmsService = {
    // Sponsors
    getSponsors: async () => {
        const response = await api.get<Sponsor[]>('/cms/sponsors');
        return response.data;
    },
    createSponsor: async (formData: FormData) => {
        const response = await api.post<Sponsor>('/cms/sponsors?type=sponsors', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    updateSponsor: async (id: number, formData: FormData) => {
        const response = await api.put<Sponsor>(`/cms/sponsors/${id}?type=sponsors`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    deleteSponsor: async (id: number) => {
        await api.delete(`/cms/sponsors/${id}`);
    },


    // Gallery
    getGalleryImages: async () => {
        const response = await api.get<GalleryImage[]>('/cms/gallery');
        return response.data;
    },
    createGalleryImage: async (formData: FormData) => {
        const response = await api.post<GalleryImage>('/cms/gallery?type=gallery', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    updateGalleryImage: async (id: number, data: Partial<Pick<GalleryImage, 'title' | 'description' | 'category' | 'active' | 'position'>>) => {
        const response = await api.put<GalleryImage>(`/cms/gallery/${id}`, data);
        return response.data;
    },
    deleteGalleryImage: async (id: number) => {
        await api.delete(`/cms/gallery/${id}`);
    },

    // Flyers
    getFlyers: async () => {
        const response = await api.get<Flyer[]>('/cms/flyers');
        return response.data;
    },
    createFlyer: async (formData: FormData) => {
        const response = await api.post<Flyer>('/cms/flyers?type=flyers', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    deleteFlyer: async (id: number) => {
        await api.delete(`/cms/flyers/${id}`);
    }
};
