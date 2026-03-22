import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fileService } from '@/services/fileService';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FolderPlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface WrapInFolderDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedFileIds: number[];
    selectedFolderIds: number[];
    currentFolderId: number | null;
    currentFolderName: string;
    onDone?: () => void;
}

export function WrapInFolderDialog({
    open,
    onOpenChange,
    selectedFileIds = [],
    selectedFolderIds = [],
    currentFolderId,
    currentFolderName = 'Root',
    onDone,
}: WrapInFolderDialogProps) {
    const queryClient = useQueryClient();
    const [folderName, setFolderName] = useState('');
    const [error, setError] = useState<string | null>(null);

    const safeSelectedFileIds = Array.isArray(selectedFileIds) ? selectedFileIds : [];
    const safeSelectedFolderIds = Array.isArray(selectedFolderIds) ? selectedFolderIds : [];

    const totalSelected = safeSelectedFileIds.length + safeSelectedFolderIds.length;

    const mutation = useMutation({
        mutationFn: async (name: string) => {
            // 1. Create the new folder in the current location
            await fileService.createFolder(name, currentFolderId);

            // 2. Get all folders to find the newly created one
            const allFolders = await fileService.getAllFolders();
            const newFolder = allFolders.find(
                f => f.name === name && f.parentId === currentFolderId
            );
            if (!newFolder) throw new Error('Neuer Ordner konnte nicht gefunden werden');

            // 3. Move all selected files and folders into the new folder
            await Promise.all([
                ...safeSelectedFileIds.map(id => fileService.moveFile(id, newFolder.id)),
                ...safeSelectedFolderIds.map(id => fileService.moveFolder(id, newFolder.id)),
            ]);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['folderContents'] });
            queryClient.invalidateQueries({ queryKey: ['allFolders'] });
            toast.success(`${totalSelected} Element(e) in neuen Ordner "${folderName}" verschoben`);
            onDone?.();
            handleClose();
        },
        onError: (err: any) => {
            setError(err.response?.data?.message || err.message || 'Fehler beim Erstellen des Ordners');
        },
    });

    const handleClose = () => {
        setFolderName('');
        setError(null);
        onOpenChange(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!folderName.trim()) return;
        setError(null);
        mutation.mutate(folderName.trim());
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>In neuen Ordner einpacken</DialogTitle>
                    <DialogDescription>
                        Erstellt einen neuen Ordner in <strong>{currentFolderName}</strong> und
                        verschiebt die {totalSelected} ausgewählten Elemente darin.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="wrapFolderName">Name des neuen Ordners</Label>
                        <Input
                            id="wrapFolderName"
                            placeholder="Ordnername"
                            value={folderName}
                            onChange={e => setFolderName(e.target.value)}
                            autoFocus
                        />
                        <p className="text-xs text-muted-foreground">
                            {safeSelectedFileIds.length > 0 && `${safeSelectedFileIds.length} Datei(en)`}
                            {safeSelectedFileIds.length > 0 && safeSelectedFolderIds.length > 0 && ' und '}
                            {safeSelectedFolderIds.length > 0 && `${safeSelectedFolderIds.length} Ordner`}
                            {' '}werden verschoben.
                        </p>
                    </div>

                    {error && (
                        <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                            {error}
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={handleClose}>
                            Abbrechen
                        </Button>
                        <Button type="submit" disabled={mutation.isPending || !folderName.trim()}>
                            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <FolderPlus className="mr-2 h-4 w-4" />
                            Erstellen & Verschieben
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
