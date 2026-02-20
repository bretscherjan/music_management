import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { fileService } from '@/services/fileService';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, File as FileIcon, X, CheckCircle2, AlertCircle } from 'lucide-react';
import type { UploadFileDto } from '@/types';

interface FileUploadDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentFolderId: number | null;
    currentFolderName: string;
}

interface FileUploadStatus {
    file: File;
    status: 'pending' | 'uploading' | 'success' | 'error';
    error?: string;
}

export function FileUploadDialog({ open, onOpenChange, currentFolderId, currentFolderName }: FileUploadDialogProps) {
    const queryClient = useQueryClient();
    const [fileStatuses, setFileStatuses] = useState<FileUploadStatus[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [globalError, setGlobalError] = useState<string | null>(null);

    const handleClose = () => {
        if (isUploading) return;
        setFileStatuses([]);
        setGlobalError(null);
        onOpenChange(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files).map((file) => ({
                file,
                status: 'pending' as const,
            }));
            setFileStatuses(newFiles);
            setGlobalError(null);
        }
    };

    const removeFile = (index: number) => {
        setFileStatuses((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (fileStatuses.length === 0 || isUploading) return;

        setIsUploading(true);
        setGlobalError(null);

        const options: UploadFileDto = {
            visibility: 'admin',
            folderId: currentFolderId,
        };

        let hasError = false;

        for (let i = 0; i < fileStatuses.length; i++) {
            const entry = fileStatuses[i];
            if (entry.status === 'success') continue;

            // Mark as uploading
            setFileStatuses((prev) =>
                prev.map((f, idx) => (idx === i ? { ...f, status: 'uploading' } : f))
            );

            try {
                await fileService.upload(entry.file, options);
                setFileStatuses((prev) =>
                    prev.map((f, idx) => (idx === i ? { ...f, status: 'success' } : f))
                );
            } catch (err: any) {
                hasError = true;
                const msg = err.response?.data?.message || 'Fehler beim Hochladen';
                setFileStatuses((prev) =>
                    prev.map((f, idx) => (idx === i ? { ...f, status: 'error', error: msg } : f))
                );
            }
        }

        setIsUploading(false);
        queryClient.invalidateQueries({ queryKey: ['folderContents'] });

        if (!hasError) {
            // All successful – close after short delay so user sees success state
            setTimeout(() => {
                setFileStatuses([]);
                onOpenChange(false);
            }, 800);
        }
    };

    const pendingCount = fileStatuses.filter((f) => f.status === 'pending' || f.status === 'error').length;
    const successCount = fileStatuses.filter((f) => f.status === 'success').length;

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Dateien hochladen</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* File Input */}
                    <div className="space-y-2">
                        <Label htmlFor="file">Dateien auswählen</Label>
                        <Input
                            id="file"
                            type="file"
                            multiple
                            onChange={handleFileChange}
                            disabled={isUploading}
                            className="cursor-pointer"
                        />
                        <p className="text-xs text-muted-foreground">
                            Mehrere Dateien können gleichzeitig ausgewählt werden (Strg+Klick oder Shift+Klick).
                        </p>
                    </div>

                    {/* File List */}
                    {fileStatuses.length > 0 && (
                        <div className="space-y-1 max-h-52 overflow-y-auto rounded-md border p-2">
                            {fileStatuses.map((entry, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center gap-2 text-sm p-1.5 rounded hover:bg-muted/50"
                                >
                                    {entry.status === 'uploading' && (
                                        <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                                    )}
                                    {entry.status === 'success' && (
                                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                                    )}
                                    {entry.status === 'error' && (
                                        <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                                    )}
                                    {entry.status === 'pending' && (
                                        <FileIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                                    )}
                                    <span className="flex-1 truncate" title={entry.file.name}>
                                        {entry.file.name}
                                    </span>
                                    <span className="text-xs text-muted-foreground shrink-0">
                                        {(entry.file.size / 1024 / 1024).toFixed(2)} MB
                                    </span>
                                    {entry.status === 'error' && (
                                        <span className="text-xs text-destructive shrink-0">{entry.error}</span>
                                    )}
                                    {(entry.status === 'pending' || entry.status === 'error') && !isUploading && (
                                        <button
                                            type="button"
                                            onClick={() => removeFile(idx)}
                                            className="shrink-0 text-muted-foreground hover:text-destructive"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Progress summary while uploading */}
                    {isUploading && (
                        <p className="text-sm text-muted-foreground text-center">
                            {successCount} / {fileStatuses.length} Dateien hochgeladen…
                        </p>
                    )}

                    {/* Folder Info */}
                    <div className="space-y-2">
                        <Label>Speicherort</Label>
                        <div className="p-2 bg-muted rounded-md text-sm font-medium flex items-center gap-2">
                            <Upload className="h-4 w-4" />
                            {currentFolderName}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Neue Dateien sind nur für Admins sichtbar. Berechtigungen können nachträglich über &quot;Berechtigungen verwalten&quot; angepasst werden.
                        </p>
                    </div>

                    {globalError && (
                        <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                            {globalError}
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2 border-t">
                        <Button type="button" variant="outline" onClick={handleClose} disabled={isUploading}>
                            Abbrechen
                        </Button>
                        <Button type="submit" disabled={pendingCount === 0 || isUploading}>
                            {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <Upload className="mr-2 h-4 w-4" />
                            {fileStatuses.length > 1
                                ? `${fileStatuses.length} Dateien hochladen`
                                : 'Hochladen'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

