import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fileService } from '@/services/fileService';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, File as FileIcon } from 'lucide-react';
import type { UploadFileDto } from '@/types';

interface FileUploadDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentFolderId: number | null;
    currentFolderName: string;
}

export function FileUploadDialog({ open, onOpenChange, currentFolderId, currentFolderName }: FileUploadDialogProps) {
    const queryClient = useQueryClient();
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const uploadMutation = useMutation({
        mutationFn: (data: { file: File, options?: UploadFileDto }) =>
            fileService.upload(data.file, data.options),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['folderContents'] });
            handleClose();
        },
        onError: (err: any) => {
            setError(err.response?.data?.message || 'Fehler beim Hochladen');
            setIsUploading(false);
        },
    });

    const handleClose = () => {
        setFile(null);
        setError(null);
        setIsUploading(false);
        onOpenChange(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setIsUploading(true);
        setError(null);

        uploadMutation.mutate({
            file,
            options: {
                visibility: 'admin',
                folderId: currentFolderId,
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Datei hochladen</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* File Input */}
                    <div className="space-y-2">
                        <Label htmlFor="file">Datei</Label>
                        <div className="flex items-center gap-2">
                            <Input id="file" type="file" onChange={handleFileChange} required className="cursor-pointer" />
                        </div>
                        {file && (
                            <div className="text-sm text-primary flex items-center gap-2">
                                <FileIcon className="h-4 w-4" />
                                {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                            </div>
                        )}
                    </div>

                    {/* Folder Info */}
                    <div className="space-y-2">
                        <Label>Speicherort</Label>
                        <div className="p-2 bg-muted rounded-md text-sm font-medium flex items-center gap-2">
                            <Upload className="h-4 w-4" />
                            {currentFolderName}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Neue Dateien sind nur für Admins sichtbar. Berechtigungen können nachträglich über "Berechtigungen verwalten" angepasst werden.
                        </p>
                    </div>

                    {error && (
                        <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2 border-t">
                        <Button type="button" variant="outline" onClick={handleClose}>
                            Abbrechen
                        </Button>
                        <Button type="submit" disabled={!file || isUploading}>
                            {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <Upload className="mr-2 h-4 w-4" />
                            Hochladen
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

