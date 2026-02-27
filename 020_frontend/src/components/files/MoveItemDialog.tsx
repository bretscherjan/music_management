import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fileService } from '@/services/fileService';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Folder, Home, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface MoveItemDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Either a file id (with type='file') or folder id (with type='folder') */
    itemId: number | null;
    itemType: 'file' | 'folder';
    itemName?: string;
    /** The id of the folder the item currently lives in (to exclude from picker) */
    currentFolderId: number | null;
}

export function MoveItemDialog({
    open,
    onOpenChange,
    itemId,
    itemType,
    itemName,
    currentFolderId,
}: MoveItemDialogProps) {
    const queryClient = useQueryClient();
    const [selectedFolderId, setSelectedFolderId] = useState<number | null | undefined>(undefined);

    const { data: allFolders = [], isLoading } = useQuery({
        queryKey: ['allFolders'],
        queryFn: () => fileService.getAllFolders(),
        enabled: open,
    });

    const mutation = useMutation({
        mutationFn: () => {
            if (itemId === null) return Promise.resolve();
            const targetId = selectedFolderId === undefined ? currentFolderId : selectedFolderId;
            if (itemType === 'file') {
                return fileService.moveFile(itemId, targetId ?? null);
            } else {
                return fileService.moveFolder(itemId, targetId ?? null);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['folderContents'] });
            toast.success(`"${itemName}" verschoben`);
            handleClose();
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Fehler beim Verschieben');
        },
    });

    const handleClose = () => {
        setSelectedFolderId(undefined);
        onOpenChange(false);
    };

    // Build a display label for a folder using its name and parent chain
    const getFolderLabel = (id: number | null): string => {
        if (id === null) return 'Root';
        const folder = allFolders.find(f => f.id === id);
        if (!folder) return 'Root';
        if (folder.parentId === null) return folder.name;
        return `${getFolderLabel(folder.parentId)} / ${folder.name}`;
    };

    // Folders the item can be moved INTO (exclude itself if it's a folder)
    const movableTargets = allFolders.filter(f => {
        if (itemType === 'folder' && f.id === itemId) return false;
        return true;
    });

    const effectiveSelected = selectedFolderId === undefined ? currentFolderId : selectedFolderId;

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {itemType === 'file' ? 'Datei' : 'Ordner'} verschieben
                        {itemName ? `: "${itemName}"` : ''}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">Zielordner auswählen:</p>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="h-64 overflow-y-auto border rounded-md">
                            <div className="p-2 space-y-1">
                                {/* Root option */}
                                <button
                                    type="button"
                                    onClick={() => setSelectedFolderId(null)}
                                    className={cn(
                                        'w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors text-left',
                                        effectiveSelected === null
                                            ? 'bg-primary text-primary-foreground'
                                            : 'hover:bg-accent'
                                    )}
                                >
                                    <Home className="h-4 w-4 shrink-0" />
                                    <span>Root</span>
                                </button>

                                {movableTargets.map(folder => (
                                    <button
                                        key={folder.id}
                                        type="button"
                                        onClick={() => setSelectedFolderId(folder.id)}
                                        className={cn(
                                            'w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors text-left',
                                            effectiveSelected === folder.id
                                                ? 'bg-primary text-primary-foreground'
                                                : 'hover:bg-accent'
                                        )}
                                    >
                                        <Folder className="h-4 w-4 shrink-0 text-primary" />
                                        <span className="truncate">{getFolderLabel(folder.id)}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {selectedFolderId !== undefined && (
                        <p className="text-xs text-muted-foreground">
                            Ziel: <strong>{getFolderLabel(selectedFolderId)}</strong>
                        </p>
                    )}
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={handleClose}>
                        Abbrechen
                    </Button>
                    <Button
                        onClick={() => mutation.mutate()}
                        disabled={mutation.isPending || selectedFolderId === undefined || selectedFolderId === currentFolderId}
                    >
                        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Verschieben
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
