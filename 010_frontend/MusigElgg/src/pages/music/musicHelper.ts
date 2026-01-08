import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { MusicPieceResponseDto } from '../../api/generated/ApiClient';
import { useState, useEffect } from 'react';

// ============================================================================
// Types
// ============================================================================
export interface MusicFilters {
    search?: string;
    genre?: string;
    instrumentationCode?: string;
    storageCabinet?: string;
    onlyAvailable?: boolean;
}

export interface CsvImportResult {
    totalRows: number;
    successCount: number;
    errorCount: number;
    errors: { lineNumber: number; column?: string; message: string }[];
}

export interface MusicAttachmentResponse {
    id: string;
    type: string; // 'Pdf', 'Audio', 'Image'
    fileName: string;
    filePath: string;
}

// ============================================================================
// Query Keys
// ============================================================================
export const musicKeys = {
    all: ['music'] as const,
    list: (filters: MusicFilters) => [...musicKeys.all, 'list', filters] as const,
    detail: (id: string) => [...musicKeys.all, 'detail', id] as const,
    genres: ['music', 'genres'] as const,
    instrumentations: ['music', 'instrumentations'] as const,
};

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to fetch music pieces with server-side filtering
 */
export const useMusicLibrary = (filters: MusicFilters = {}) => {
    return useQuery({
        queryKey: musicKeys.list(filters),
        queryFn: async (): Promise<MusicPieceResponseDto[]> => {
            const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5141';
            const query = new URLSearchParams();

            if (filters.search) query.append('search', filters.search);
            if (filters.genre) query.append('genre', filters.genre);
            if (filters.instrumentationCode) query.append('instrumentationCode', filters.instrumentationCode);
            if (filters.storageCabinet) query.append('storageCabinet', filters.storageCabinet);
            if (filters.onlyAvailable) query.append('onlyAvailable', 'true');

            // Manual fetch since generated client doesn't support these filters yet
            const response = await fetch(`${baseUrl}/api/MusicPieces?${query.toString()}`, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('jwt')}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch music pieces');
            return response.json();
        }
    });
};

/**
 * Hook to fetch available filters (Genres, Instrumentations)
 */
export const useMusicFilters = () => {
    const genresQuery = useQuery({
        queryKey: musicKeys.genres,
        queryFn: async (): Promise<string[]> => {
            const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5141';
            const response = await fetch(`${baseUrl}/api/MusicPieces/genres`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('jwt')}` }
            });
            if (!response.ok) return [];
            return response.json();
        }
    });

    const instrumentationsQuery = useQuery({
        queryKey: musicKeys.instrumentations,
        queryFn: async (): Promise<string[]> => {
            const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5141';
            const response = await fetch(`${baseUrl}/api/MusicPieces/instrumentation-codes`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('jwt')}` }
            });
            if (!response.ok) return [];
            return response.json();
        }
    });

    return {
        genres: genresQuery.data || [],
        instrumentations: instrumentationsQuery.data || [],
        isLoading: genresQuery.isLoading || instrumentationsQuery.isLoading
    };
};

/**
 * Hook for Mutations (Import, Delete, Upload)
 */
export const useMusicMutations = () => {
    const queryClient = useQueryClient();
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5141';

    const importCsv = useMutation({
        mutationFn: async ({ file, delimiter = ';' }: { file: File; delimiter?: string }) => {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${baseUrl}/api/MusicPieces/import-csv?delimiter=${encodeURIComponent(delimiter)}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('jwt')}`
                },
                body: formData
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Import failed');
            }
            return response.json() as Promise<CsvImportResult>;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: musicKeys.all });
            queryClient.invalidateQueries({ queryKey: musicKeys.genres });
        }
    });

    const uploadAttachment = useMutation({
        mutationFn: async ({ id, file, type, description }: { id: string; file: File; type: 'Pdf' | 'Audio' | 'Image'; description?: string }) => {
            const formData = new FormData();
            formData.append('file', file);

            let url = `${baseUrl}/api/MusicPieces/${id}/attachments?type=${type}`;
            if (description) url += `&description=${encodeURIComponent(description)}`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('jwt')}`
                },
                body: formData
            });

            if (!response.ok) throw new Error('Upload failed');
            return response.json() as Promise<MusicAttachmentResponse>;
        },
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: musicKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: musicKeys.all });
        }
    });

    const deleteAttachment = useMutation({
        mutationFn: async ({ musicPieceId, attachmentId }: { musicPieceId: string; attachmentId: string }) => {
            const response = await fetch(`${baseUrl}/api/MusicPieces/${musicPieceId}/attachments/${attachmentId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('jwt')}`
                }
            });
            if (!response.ok) throw new Error('Delete failed');
        },
        onSuccess: (_, { musicPieceId }) => {
            queryClient.invalidateQueries({ queryKey: musicKeys.detail(musicPieceId) });
        }
    });

    return {
        importCsv,
        uploadAttachment,
        deleteAttachment
    };
};

/**
 * Hook to stream secure files (PDF/Audio) from API
 * Returns a temporary ObjectURL that includes the Auth header in the fetch
 */
export const useSecureFile = (filePath: string | undefined | null) => {
    const [objectUrl, setObjectUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!filePath) {
            setObjectUrl(null);
            return;
        }

        let active = true;
        const fetchFile = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // If it's a full URL, just use it (unless it needs auth, assume backend serves relative paths for secure content)
                // Backend returns "/uploads/..."
                const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5141';
                // Adjust path if it starts with /
                const cleanPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
                const url = `${baseUrl}${cleanPath}`;

                // Fetch as blob with auth
                const response = await fetch(url, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('jwt')}`
                    }
                });

                if (!response.ok) throw new Error(`Failed to load file: ${response.statusText}`);

                const blob = await response.blob();
                if (active) {
                    const newUrl = URL.createObjectURL(blob);
                    setObjectUrl(newUrl);
                }
            } catch (err) {
                if (active) {
                    console.error(err);
                    setError('File could not be loaded');
                }
            } finally {
                if (active) setIsLoading(false);
            }
        };

        fetchFile();

        return () => {
            active = false;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [filePath]);

    return { objectUrl, isLoading, error };
};
