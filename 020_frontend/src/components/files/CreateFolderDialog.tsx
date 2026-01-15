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
    currentFolder?: string;
}

export function CreateFolderDialog({ open, onOpenChange, currentFolder = '/' }: CreateFolderDialogProps) {
    const queryClient = useQueryClient();
    const [folderName, setFolderName] = useState('');
    const [error, setError] = useState<string | null>(null);

    const mutation = useMutation({
        mutationFn: (newPath: string) => fileService.createFolder(newPath),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['folders'] });
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

        // Construct full path
        // If currentFolder is root, just /Name. Else /Parent/Name
        const parent = currentFolder === '/' ? '' : currentFolder;
        // Ensure leading slash for input if user typed it, preventing double slash
        let cleanName = folderName.trim();
        // However, the requirement says "absoluten pfad ab / an" (enter absolute path from /).
        // But usually "Create Folder" in a context implies searching IN that context.
        // Let's support both: if starts with /, it's absolute. Else relative to current.

        // Actually, user said: "beim ordner hinzufügen, gibt man einen absoluten pfad ab / an"
        // So we should default to absolute path input? Or prepopulate?
        // Let's prepopulate with current folder + /

        let finalPath = '';
        if (cleanName.startsWith('/')) {
            finalPath = cleanName;
        } else {
            finalPath = `${parent}/${cleanName}`;
        }

        mutation.mutate(finalPath);
    };

    // Pre-fill logic could go here, but let's keep it simple first

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Neuen Ordner erstellen</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="folderName">Ordnerpfad</Label>
                        <div className="flex items-center gap-2">
                            <span className="text-muted-foreground text-sm font-mono whitespace-nowrap">
                                {currentFolder === '/' ? '/' : currentFolder + '/'}
                            </span>
                            <Input
                                id="folderName"
                                placeholder="Ordnername"
                                value={folderName}
                                onChange={(e) => setFolderName(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Erstellt einen neuen Ordner im aktuellen Verzeichnis.
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
