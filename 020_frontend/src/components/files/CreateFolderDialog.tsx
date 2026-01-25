import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fileService } from '@/services/fileService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, FolderPlus } from 'lucide-react';

interface CreateFolderDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentFolderId: number | null;
    currentFolderName: string;
}

export function CreateFolderDialog({ open, onOpenChange, currentFolderId, currentFolderName }: CreateFolderDialogProps) {
    const queryClient = useQueryClient();
    const [folderName, setFolderName] = useState('');
    const [error, setError] = useState<string | null>(null);

    const mutation = useMutation({
        mutationFn: (name: string) => fileService.createFolder(name, currentFolderId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['folderContents'] });
            handleClose();
        },
        onError: (err: any) => {
            setError(err.response?.data?.message || 'Fehler beim Erstellen des Ordners');
        },
    });

    const handleClose = () => {
        setFolderName('');
        setError(null);
        onOpenChange(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!folderName.trim()) return;
        mutation.mutate(folderName.trim());
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Neuen Ordner erstellen</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="folderName">Name</Label>
                        <Input
                            id="folderName"
                            placeholder="Ordnername"
                            value={folderName}
                            onChange={(e) => setFolderName(e.target.value)}
                            autoFocus
                        />
                        <p className="text-xs text-muted-foreground">
                            Erstellt einen neuen Ordner in <strong>{currentFolderName}</strong>.
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
                            Erstellen
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
