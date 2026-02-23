import api from '@/lib/api';

export interface Sponsor {
    id: number;
    name: string;
    logoUrl: string;
    websiteUrl?: string;
    active: boolean;
    position: number;
}

export interface CarouselItem {
    id: number;
    imageUrl: string;
    title?: string;
    description?: string;
    link?: string;
    active: boolean;
    position: number;
}

export interface GalleryImage {
    id: number;
    filename: string;
    title?: string;
    description?: string;
    category?: string;
    position: number;
    createdAt: string;
}

export interface Flyer {
    id: number;
    filename: string;
    title: string;
    activeFrom?: string;
    activeTo?: string;
    active: boolean;
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

    // Carousel
    getCarouselItems: async () => {
        const response = await api.get<CarouselItem[]>('/cms/carousel');
        return response.data;
    },
    createCarouselItem: async (formData: FormData) => {
        const response = await api.post<CarouselItem>('/cms/carousel?type=carousel', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    updateCarouselItem: async (id: number, formData: FormData) => {
        const response = await api.put<CarouselItem>(`/cms/carousel/${id}?type=carousel`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    deleteCarouselItem: async (id: number) => {
        await api.delete(`/cms/carousel/${id}`);
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
