import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface FolderInputDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (folderName: string) => void;
    currentFolder: string;
    isLoading?: boolean;
}

export function FolderInputDialog({
    open,
    onOpenChange,
    onConfirm,
    currentFolder,
    isLoading = false,
}: FolderInputDialogProps) {
    const [folderName, setFolderName] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validate folder name
        if (!folderName.trim()) {
            setError('Bitte geben Sie einen Ordnernamen ein');
            return;
        }

        if (folderName.includes('/') || folderName.includes('\\')) {
            setError('Ordnername darf keine Schrägstriche enthalten');
            return;
        }

        // Build full path
        const fullPath = currentFolder === '/'
            ? `/${folderName}`
            : `${currentFolder}/${folderName}`;

        onConfirm(fullPath);
        handleClose();
    };

    const handleClose = () => {
        setFolderName('');
        setError(null);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Neuer Ordner</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="folderName">Ordnername</Label>
                        <Input
                            id="folderName"
                            value={folderName}
                            onChange={(e) => {
                                setFolderName(e.target.value);
                                setError(null);
                            }}
                            placeholder="z.B. Noten 2024"
                            autoFocus
                        />
                        {error && (
                            <p className="text-sm text-destructive">{error}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            Wird erstellt in: {currentFolder === '/' ? '/' : currentFolder}
                        </p>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={handleClose}>
                            Abbrechen
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Erstellen
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
