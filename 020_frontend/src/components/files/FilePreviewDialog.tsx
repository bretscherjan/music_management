
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
    ChevronLeft,
    ChevronRight,
    Download,
    X,
    Loader2,
    FileText
} from 'lucide-react';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

import type { FileEntity } from '@/types';
import { fileService } from '@/services/fileService';
import { formatFileSize } from '@/lib/utils';

// PDF Worker - important to match the installed version
// We use a CDN version to avoid complex build config changes for now
const PDF_WORKER_URL = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

interface FilePreviewDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    files: FileEntity[]; // List of files for navigation
    initialFileId: number | null;
}

export function FilePreviewDialog({
    open,
    onOpenChange,
    files,
    initialFileId
}: FilePreviewDialogProps) {
    const [currentIndex, setCurrentIndex] = useState<number>(-1);
    const [loading, setLoading] = useState(true);
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const defaultLayoutPluginInstance = defaultLayoutPlugin();

    // Initialize index when opening
    useEffect(() => {
        if (open && initialFileId) {
            const index = files.findIndex(f => f.id === initialFileId);
            if (index !== -1) {
                setCurrentIndex(index);
            }
        }
    }, [open, initialFileId, files]);

    // Load file content when index changes
    useEffect(() => {
        if (!open || currentIndex === -1) return;

        const file = files[currentIndex];
        setLoading(true);
        setError(null);
        setFileUrl(null);

        // Pre-check if previewable
        if (!isPreviewable(file.mimetype)) {
            setLoading(false);
            return;
        }

        let objectUrl: string | null = null;

        const loadFile = async () => {
            try {
                const blob = await fileService.download(file.id);
                objectUrl = URL.createObjectURL(blob);
                setFileUrl(objectUrl);
            } catch (err) {
                console.error("Preview load failed:", err);
                setError("Vorschau konnte nicht geladen werden.");
            } finally {
                setLoading(false);
            }
        };

        loadFile();

        // Cleanup
        return () => {
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [currentIndex, open, files]);

    // Keyboard navigation
    useEffect(() => {
        if (!open) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') handleNext();
            if (e.key === 'ArrowLeft') handlePrev();
            if (e.key === 'Escape') onOpenChange(false);
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [open, currentIndex]);


    const handleNext = () => {
        if (currentIndex < files.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const isPreviewable = (mimetype: string) => {
        return mimetype.startsWith('image/') || mimetype === 'application/pdf' || mimetype === 'text/plain';
    };

    if (!open || currentIndex === -1) return null;

    const currentFile = files[currentIndex];
    const isFirst = currentIndex === 0;
    const isLast = currentIndex === files.length - 1;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-6xl w-full h-[90vh] p-0 gap-0 bg-background/95 backdrop-blur-sm border-none shadow-2xl flex flex-col" aria-describedby="file-preview-description">
                <DialogTitle className="sr-only">Dateivorschau: {currentFile.originalName}</DialogTitle>
                <div id="file-preview-description" className="sr-only">
                    Vorschau der Datei {currentFile.originalName} ({formatFileSize(currentFile.size)})
                </div>

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b bg-muted/20">
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                            <h2 className="text-lg font-semibold truncate max-w-md">{currentFile.originalName}</h2>
                            <span className="text-sm text-muted-foreground">
                                {formatFileSize(currentFile.size)} • {currentIndex + 1} von {files.length}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => fileService.downloadAndSave(currentFile.id, currentFile.originalName)}
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 relative bg-black/5 flex items-center justify-center overflow-hidden">

                    {/* Navigation Buttons (Overlay) */}
                    {!isFirst && (
                        <Button
                            variant="secondary"
                            size="icon"
                            className="absolute left-4 z-10 rounded-full h-10 w-10 shadow-lg opacity-50 hover:opacity-100 transition-opacity"
                            onClick={handlePrev}
                        >
                            <ChevronLeft className="h-6 w-6" />
                        </Button>
                    )}

                    {!isLast && (
                        <Button
                            variant="secondary"
                            size="icon"
                            className="absolute right-4 z-10 rounded-full h-10 w-10 shadow-lg opacity-50 hover:opacity-100 transition-opacity"
                            onClick={handleNext}
                        >
                            <ChevronRight className="h-6 w-6" />
                        </Button>
                    )}

                    {/* Preview Content */}
                    <div className="w-full h-full p-4 flex items-center justify-center overflow-auto animate-in fade-in duration-300">
                        {loading ? (
                            <div className="flex flex-col items-center gap-2">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <p className="text-muted-foreground">Lade Vorschau...</p>
                            </div>
                        ) : error ? (
                            <div className="text-center text-destructive">
                                <p>{error}</p>
                            </div>
                        ) : !isPreviewable(currentFile.mimetype) ? (
                            <div className="text-center flex flex-col items-center gap-4">
                                <div className="bg-muted p-6 rounded-full">
                                    <FileText className="h-12 w-12 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-lg font-medium">Keine Vorschau verfügbar</p>
                                    <p className="text-muted-foreground">Dieser Dateityp ({currentFile.mimetype}) kann nicht direkt angezeigt werden.</p>
                                </div>
                                <Button onClick={() => fileService.downloadAndSave(currentFile.id, currentFile.originalName)}>
                                    Datei herunterladen
                                </Button>
                            </div>
                        ) : fileUrl && (
                            <>
                                {currentFile.mimetype === 'application/pdf' ? (
                                    <div className="w-full h-full pdf-container bg-white rounded shadow-sm overflow-auto">
                                        <Worker workerUrl={PDF_WORKER_URL}>
                                            <Viewer
                                                fileUrl={fileUrl}
                                                plugins={[defaultLayoutPluginInstance]}
                                                theme="light"
                                            />
                                        </Worker>
                                    </div>
                                ) : currentFile.mimetype.startsWith('image/') ? (
                                    <img
                                        src={fileUrl}
                                        alt={currentFile.originalName}
                                        className="max-w-full max-h-full object-contain rounded shadow-lg"
                                    />
                                ) : (
                                    <iframe src={fileUrl} className="w-full h-full bg-white rounded border" title="Text Preview" />
                                )}
                            </>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
