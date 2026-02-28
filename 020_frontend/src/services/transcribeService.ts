import api from '../lib/api';

export interface TranscribeResult {
    text: string;
    language?: string;
    duration_seconds?: number;
}

export interface WhisperHealth {
    status: string;
    model?: string;
    device?: string;
}

const transcribeService = {
    async transcribe(audioBlob: Blob, filename = 'recording.webm'): Promise<TranscribeResult> {
        const form = new FormData();
        form.append('audio', audioBlob, filename);
        const { data } = await api.post<TranscribeResult>('/transcribe', form, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 30 * 60 * 1000,
        });
        return data;
    },

    async checkHealth(): Promise<WhisperHealth> {
        const { data } = await api.get<WhisperHealth>('/transcribe/health');
        return data;
    },
};

export default transcribeService;
