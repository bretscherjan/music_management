import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { newsService } from '@/services/newsService';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import type { CreateNewsDto } from '@/types';

interface CreateNewsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateNewsDialog({ open, onOpenChange }: CreateNewsDialogProps) {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState<CreateNewsDto>({
        title: '',
        content: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createMutation = useMutation({
        mutationFn: newsService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['news'] });
            handleClose();
        },
        onError: (err: any) => {
            setError(err.response?.data?.message || 'Fehler beim Erstellen der News');
            setIsLoading(false);
        },
    });

    const handleClose = () => {
        setFormData({ title: '', content: '' });
        setError(null);
        setIsLoading(false);
        onOpenChange(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        createMutation.mutate(formData);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Neuigkeit erstellen</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Titel</Label>
                        <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                            placeholder="Titel der Nachricht"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="content">Inhalt</Label>
                        <Textarea
                            id="content"
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            required
                            placeholder="Schreiben Sie hier Ihre Nachricht..."
                            rows={8}
                        />
                    </div>

                    {error && (
                        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={handleClose}>
                            Abbrechen
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Veröffentlichen
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
