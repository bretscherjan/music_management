import React from 'react';
import { useSecureFile } from './musicHelper';
import { Music, Loader } from 'lucide-react';

interface SecureAudioPlayerProps {
    filePath: string;
}

export const SecureAudioPlayer: React.FC<SecureAudioPlayerProps> = ({ filePath }) => {

    const { objectUrl, isLoading, error } = useSecureFile(filePath);

    if (error) {
        return (
            <div className="flex items-center text-red-500 text-xs" title={error}>
                <Music className="h-4 w-4 mr-1" />
                <span className="line-through">N/A</span>
            </div>
        );
    }

    if (isLoading) {
        return <Loader className="h-4 w-4 animate-spin text-secondary-500" />;
    }

    if (!objectUrl) {
        return null;
    }

    return (
        <div className="flex items-center gap-2">
            <audio
                controls
                controlsList="nodownload"
                className="h-8 w-48 rounded-md bg-neutral-100" // Simple styling, browser native controls
                src={objectUrl}
            >
                Ihr Browser unterstützt das Audio-Element nicht.
            </audio>
        </div>
    );
};
