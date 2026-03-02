import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fileService } from '@/services/fileService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Pencil } from 'lucide-react';

interface RenameFolderDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    folderId: number;
    currentName: string;
}

export function RenameFolderDialog({ open, onOpenChange, folderId, currentName }: RenameFolderDialogProps) {
    const queryClient = useQueryClient();
    const [folderName, setFolderName] = useState(currentName);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            setFolderName(currentName);
            setError(null);
        }
    }, [open, currentName]);

    const mutation = useMutation({
        mutationFn: (name: string) => fileService.renameFolder(folderId, name),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['folderContents'] });
            onOpenChange(false);
        },
        onError: (err: any) => {
            setError(err.response?.data?.message || 'Fehler beim Umbenennen des Ordners');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = folderName.trim();
        if (!trimmed || trimmed === currentName) return;
        mutation.mutate(trimmed);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Ordner umbenennen</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="renameFolderName">Neuer Name</Label>
                        <Input
                            id="renameFolderName"
                            placeholder="Ordnername"
                            value={folderName}
                            onChange={(e) => setFolderName(e.target.value)}
                            autoFocus
                        />
                    </div>

                    {error && (
                        <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                            {error}
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Abbrechen
                        </Button>
                        <Button
                            type="submit"
                            disabled={mutation.isPending || !folderName.trim() || folderName.trim() === currentName}
                        >
                            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <Pencil className="mr-2 h-4 w-4" />
                            Umbenennen
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
