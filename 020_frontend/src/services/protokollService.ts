import api from '../lib/api';
import { storage } from '../lib/storage';

export interface TranscribeProgress {
    type: 'progress' | 'chunk_text' | 'complete' | 'error';
    chunk?: number;
    total?: number;
    percent?: number;
    text?: string;
    duration_seconds?: number;
    detail?: string;
}

export interface SummarizeResult {
    protocol: string;
}

const protokollService = {
    /**
     * Transcribe audio file. For small files returns directly,
     * for large files uses SSE streaming with progress.
     */
    async transcribe(
        audioBlob: Blob,
        filename = 'recording.webm',
        onProgress?: (event: TranscribeProgress) => void
    ): Promise<{ text: string; duration_seconds?: number }> {
        const form = new FormData();
        form.append('audio', audioBlob, filename);

        const isLarge = audioBlob.size > 20 * 1024 * 1024; // > 20 MB

        if (!isLarge || !onProgress) {
            // Simple request for short files
            const { data } = await api.post('/protokoll/transcribe', form, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 30 * 60 * 1000,
            });
            return data;
        }

        // SSE streaming for large files
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            const token = storage.getItem('accessToken');
            // api is an axios instance, baseURL might be undefined if not explicitly set, 
            // but we can just use the import.meta.env.VITE_API_URL
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3004/api';
            xhr.open('POST', `${baseUrl}/protokoll/transcribe`);
            if (token) {
                // Remove quotes if present, sometimes token is stored with them
                const cleanToken = token.replace(/^"(.*)"$/, '$1');
                xhr.setRequestHeader('Authorization', `Bearer ${cleanToken}`);
            }
            xhr.timeout = 3 * 60 * 60 * 1000; // 3 hours

            let buffer = '';
            let finalText = '';
            let finalDuration = 0;

            xhr.onprogress = () => {
                buffer += xhr.responseText.substring(buffer.length);
                const lines = buffer.split('\n');

                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue;
                    try {
                        const event: TranscribeProgress = JSON.parse(line.substring(6));
                        onProgress(event);

                        if (event.type === 'complete') {
                            finalText = event.text || '';
                            finalDuration = event.duration_seconds || 0;
                        }
                    } catch {
                        // Ignore incomplete JSON
                    }
                }
            };

            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve({ text: finalText, duration_seconds: finalDuration });
                } else {
                    reject(new Error(`Transkription fehlgeschlagen: ${xhr.status}`));
                }
            };

            xhr.onerror = () => reject(new Error('Netzwerkfehler bei der Transkription'));
            xhr.ontimeout = () => reject(new Error('Transkription hat zu lange gedauert'));
            xhr.send(form);
        });
    },

    /**
     * Summarize raw transcription into a structured protocol via LLM.
     */
    async summarize(text: string): Promise<string> {
        const { data } = await api.post<SummarizeResult>('/protokoll/summarize', { text }, {
            timeout: 10 * 60 * 1000,
        });
        return data.protocol;
    },

    /**
     * Export protocol as TXT, PDF, or MD. Returns a downloadable blob.
     */
    async exportProtokoll(
        title: string,
        content: string,
        format: 'txt' | 'pdf' | 'md'
    ): Promise<void> {
        const response = await api.post('/protokoll/export',
            { title, content, format },
            { responseType: 'blob', timeout: 60000 }
        );

        // Trigger browser download
        const blob = new Blob([response.data]);
        const ext = format;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title || 'Protokoll'}.${ext}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    },

    /**
     * Check Whisper + LLM health.
     */
    async checkHealth(): Promise<{ whisper: { status: string }; llm: { status: string } }> {
        const { data } = await api.get('/protokoll/health');
        return data;
    },
};

export default protokollService;
