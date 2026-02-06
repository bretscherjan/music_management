
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import {
    ChevronLeft,
    ChevronRight,
    Download,
    X,
    Loader2,
    FileIcon,
    AlertCircle
} from 'lucide-react';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import { DocumentEditor } from "@onlyoffice/document-editor-react";

import type { FileEntity } from '@/types';
import fileService from '@/services/fileService';

// PDF Worker - important to match the installed version
// We use a CDN version to avoid complex build config changes for now
const PDF_WORKER_URL = 'https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js';

// OnlyOffice document server URL is now provided by the backend config

interface FilePreviewDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    files: FileEntity[];
    initialFileId: number | null;
}

export function FilePreviewDialog({
    open,
    onOpenChange,
    files,
    initialFileId
}: FilePreviewDialogProps) {
    const defaultLayoutPluginInstance = defaultLayoutPlugin();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [onlyOfficeConfig, setOnlyOfficeConfig] = useState<any>(null);

    // Initial load sync
    useEffect(() => {
        if (open && initialFileId) {
            const index = files.findIndex(f => f.id === initialFileId);
            if (index >= 0) setCurrentIndex(index);
        }
    }, [open, initialFileId, files]);

    const currentFile = files[currentIndex];

    // Load file content
    useEffect(() => {
        if (!open || !currentFile) return;

        let objectUrl: string | null = null;
        let isCancelled = false;

        const loadFile = async () => {
            setLoading(true);
            setError(null);
            setFileUrl(null);
            setOnlyOfficeConfig(null);

            try {
                if (isOfficeFile(currentFile.mimetype)) {
                    // Office Files: Get config from backend
                    const config = await fileService.getOnlyOfficeConfig(currentFile.id);
                    if (!isCancelled) setOnlyOfficeConfig(config);
                } else {
                    // Regular download (PDF, Image, Text) for local viewing
                    const blob = await fileService.download(currentFile.id);
                    if (!isCancelled) {
                        objectUrl = URL.createObjectURL(blob);
                        setFileUrl(objectUrl);
                    }
                }
            } catch (err: any) {
                if (!isCancelled) {
                    console.error("Preview load failed:", err);
                    const msg = err.response?.data?.message || err.message || "Vorschau konnte nicht geladen werden.";
                    setError(msg);
                }
            } finally {
                if (!isCancelled) setLoading(false);
            }
        };

        loadFile();

        return () => {
            isCancelled = true;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [currentFile, open]);

    const handleNext = () => {
        if (currentIndex < files.length - 1) {
            setCurrentIndex(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowRight') handleNext();
        if (e.key === 'ArrowLeft') handlePrev();
        if (e.key === 'Escape') onOpenChange(false);
    };

    const isOfficeFile = (mimetype: string) => {
        return (
            mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            mimetype === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        );
    };

    const isPreviewable = (mimetype: string) => {
        return (
            mimetype.startsWith('image/') ||
            mimetype === 'application/pdf' ||
            mimetype === 'text/plain' ||
            isOfficeFile(mimetype)
        );
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };


    if (!open || !currentFile) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[100] bg-background text-foreground flex flex-col animate-in fade-in-0 slide-in-from-bottom-5 duration-300"
            onKeyDown={handleKeyDown}
            tabIndex={-1}
            // Auto focus on mount to capture keys
            ref={(el) => el?.focus()}
        >
            {/* --- Static Header --- */}
            <div className="h-14 flex-none flex items-center justify-between px-4 sm:px-6 bg-zinc-900 border-b border-white/10 text-white shadow-md z-50">
                {/* Left: File Info */}
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="p-2 rounded-lg bg-white/10 hidden sm:block">
                        <FileIcon className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="font-medium text-sm truncate max-w-[200px] sm:max-w-md lg:max-w-xl" title={currentFile.originalName}>
                            {currentFile.originalName}
                        </span>
                        <span className="text-xs text-zinc-400 hidden sm:inline-block">
                            {formatFileSize(currentFile.size)}
                        </span>
                    </div>
                </div>

                {/* Center: Navigation (Desktop) */}
                <div className="hidden md:flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handlePrev}
                        disabled={currentIndex === 0}
                        className="h-9 w-9 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 disabled:opacity-30"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <span className="text-sm text-zinc-400 font-mono w-16 text-center select-none">
                        {currentIndex + 1} / {files.length}
                    </span>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleNext}
                        disabled={currentIndex === files.length - 1}
                        className="h-9 w-9 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 disabled:opacity-30"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </Button>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2">
                    {/* Mobile Nav (Compact) */}
                    <div className="flex md:hidden items-center mr-2 border-r border-white/10 pr-2">
                        <Button variant="ghost" size="icon" onClick={handlePrev} disabled={currentIndex === 0} className="h-8 w-8 text-white"><ChevronLeft className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={handleNext} disabled={currentIndex === files.length - 1} className="h-8 w-8 text-white"><ChevronRight className="w-4 h-4" /></Button>
                    </div>

                    <Button
                        variant="ghost"
                        className="text-zinc-400 hover:text-white hover:bg-white/10 gap-2 hidden sm:flex"
                        onClick={() => fileService.downloadAndSave(currentFile.id, currentFile.originalName)}
                    >
                        <Download className="w-4 h-4" />
                        <span className="text-xs">Speichern</span>
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-zinc-400 hover:text-white hover:bg-white/10 sm:hidden"
                        onClick={() => fileService.downloadAndSave(currentFile.id, currentFile.originalName)}
                    >
                        <Download className="w-5 h-5" />
                    </Button>

                    <div className="h-6 w-px bg-white/10 mx-1" />

                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-full"
                        onClick={() => onOpenChange(false)}
                        title="Schließen"
                    >
                        <X className="w-6 h-6" />
                    </Button>
                </div>
            </div>

            {/* --- Main Content Area --- */}
            <div className="flex-1 w-full relative overflow-hidden flex flex-col items-center justify-center bg-zinc-950">
                {loading ? (
                    <div className="flex flex-col items-center gap-4 text-white/50">
                        <Loader2 className="w-12 h-12 animate-spin" />
                        <span className="text-sm font-medium tracking-wide uppercase">Lade Vorschau...</span>
                    </div>
                ) : error ? (
                    <div className="max-w-md w-full p-8 rounded-2xl bg-zinc-900/50 backdrop-blur-md border border-white/10 flex flex-col items-center text-center gap-6">
                        <div className="p-4 rounded-full bg-red-500/10">
                            <AlertCircle className="w-10 h-10 text-red-500" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-lg font-semibold text-white">Vorschau nicht möglich</h3>
                            <p className="text-sm text-zinc-400">{error}</p>
                        </div>
                        <Button
                            variant="secondary"
                            className="w-full gap-2 font-medium"
                            onClick={() => fileService.downloadAndSave(currentFile.id, currentFile.originalName)}
                        >
                            <Download className="w-4 h-4" />
                            Datei trotzdem herunterladen
                        </Button>
                    </div>
                ) : !isPreviewable(currentFile.mimetype) ? (
                    <div className="max-w-md w-full p-8 rounded-2xl bg-zinc-900/50 backdrop-blur-md border border-white/10 flex flex-col items-center text-center gap-6">
                        <div className="p-4 rounded-full bg-blue-500/10">
                            <FileIcon className="w-10 h-10 text-blue-500" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-lg font-semibold text-white">Dateityp nicht unterstützt</h3>
                            <p className="text-sm text-zinc-400">
                                Für <strong>.{currentFile.originalName.split('.').pop()}</strong> Dateien ist keine Vorschau verfügbar.
                            </p>
                        </div>
                        <Button
                            variant="secondary"
                            className="w-full gap-2 font-medium"
                            onClick={() => fileService.downloadAndSave(currentFile.id, currentFile.originalName)}
                        >
                            <Download className="w-4 h-4" />
                            Herunterladen
                        </Button>
                    </div>
                ) : (fileUrl || onlyOfficeConfig) && (
                    <div className="w-full h-full flex flex-col">
                        {currentFile.mimetype.startsWith('image/') && fileUrl ? (
                            <div className="flex-1 w-full h-full flex items-center justify-center p-4">
                                <img
                                    src={fileUrl!}
                                    alt={currentFile.originalName}
                                    className="max-w-full max-h-full object-contain rounded-md shadow-2xl"
                                    style={{ filter: "drop-shadow(0 25px 50px -12px rgb(0 0 0 / 0.5))" }}
                                />
                            </div>
                        ) : currentFile.mimetype === 'application/pdf' && fileUrl ? (
                            <div className="flex-1 w-full h-full bg-zinc-100 overflow-auto">
                                <Worker workerUrl={PDF_WORKER_URL}>
                                    <Viewer
                                        fileUrl={fileUrl}
                                        plugins={[defaultLayoutPluginInstance]}
                                        theme="light"
                                    />
                                </Worker>
                            </div>
                        ) : isOfficeFile(currentFile.mimetype) && onlyOfficeConfig ? (
                            <div className="flex-1 w-full h-full bg-white">
                                <DocumentEditor
                                    id={`docEditor-${currentFile.id}`}
                                    documentServerUrl={onlyOfficeConfig?.documentServerUrl}
                                    config={onlyOfficeConfig}
                                    onLoadComponentError={(errorCode, errorDescription) => {
                                        console.error("OnlyOffice Load Error:", errorCode, errorDescription);
                                        setError(`OnlyOffice Error: ${errorDescription}. Bitte stellen Sie sicher, dass der Document Server läuft.`);
                                    }}
                                />
                            </div>
                        ) : (
                            <iframe src={fileUrl ?? undefined} className="flex-1 w-full h-full bg-white" title="Text Preview" />
                        )}
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}

