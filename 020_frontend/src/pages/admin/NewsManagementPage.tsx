import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { newsService } from '@/services/newsService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Loader2, Calendar } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { CreateNewsDto, UpdateNewsDto } from '@/types';

export function NewsManagementPage() {
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [editingNews, setEditingNews] = useState<{ id: number; title: string; content: string } | null>(null);
    const [deletingNewsId, setDeletingNewsId] = useState<number | null>(null);
    const [formData, setFormData] = useState({ title: '', content: '' });

    // Fetch News
    const { data: newsList, isLoading } = useQuery({
        queryKey: ['news'],
        queryFn: () => newsService.getAll(),
    });

    // Create Mutation
    const createMutation = useMutation({
        mutationFn: (data: CreateNewsDto) => newsService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['news'] });
            setIsDialogOpen(false);
            resetForm();
        },
    });

    // Update Mutation
    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateNewsDto }) => newsService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['news'] });
            setIsDialogOpen(false);
            resetForm();
        },
    });

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: newsService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['news'] });
            setIsDeleteDialogOpen(false);
            setDeletingNewsId(null);
        },
    });

    const resetForm = () => {
        setFormData({ title: '', content: '' });
        setEditingNews(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingNews) {
                await updateMutation.mutateAsync({
                    id: editingNews.id,
                    data: formData,
                });
            } else {
                await createMutation.mutateAsync(formData);
            }
        } catch (error) {
            console.error('Failed to save news:', error);
        }
    };

    const handleEdit = (news: any) => {
        setEditingNews({ id: news.id, title: news.title, content: news.content });
        setFormData({ title: news.title, content: news.content });
        setIsDialogOpen(true);
    };

    const handleDeleteClick = (id: number) => {
        setDeletingNewsId(id);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (deletingNewsId) {
            deleteMutation.mutate(deletingNewsId);
        }
    };

    const isSubmitting = createMutation.isPending || updateMutation.isPending;

    if (isLoading) {
        return (
            <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">News Verwaltung</h1>
                    <p className="text-muted-foreground">
                        Aktuelle Nachrichten für die Mitglieder verwalten
                    </p>
                </div>
                <Button className="gap-2" onClick={() => setIsDialogOpen(true)}>
                    <Plus className="h-4 w-4" />
                    News erstellen
                </Button>
            </div>

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) resetForm();
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingNews ? 'News bearbeiten' : 'Neue News erstellen'}</DialogTitle>
                        <DialogDescription>
                            Erstelle eine Nachricht, die für alle Mitglieder sichtbar ist.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Titel</Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                                placeholder="z.B. Probe fällt aus"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="content">Inhalt</Label>
                            <Textarea
                                id="content"
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                required
                                placeholder="Details zur Nachricht..."
                                rows={5}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                Abbrechen
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {editingNews ? 'Speichern' : 'Erstellen'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Bist du sicher?</DialogTitle>
                        <DialogDescription>
                            Diese Aktion kann nicht rückgängig gemacht werden. Die News wird dauerhaft gelöscht.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                            Abbrechen
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmDelete}
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Löschen
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {newsList?.map((news) => (
                    <Card key={news.id} className="flex flex-col h-full">
                        <CardHeader>
                            <CardTitle className="line-clamp-2">{news.title}</CardTitle>
                            <CardDescription className="flex items-center gap-2 text-xs">
                                <Calendar className="h-3 w-3" />
                                {formatDate(news.createdAt)}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-4">
                                {news.content}
                            </p>
                        </CardContent>
                        <div className="p-6 pt-0 mt-auto flex justify-end gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(news)}
                            >
                                <Pencil className="h-4 w-4" />
                                <span className="sr-only">Bearbeiten</span>
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteClick(news.id)}
                            >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Löschen</span>
                            </Button>
                        </div>
                    </Card>
                ))}
                {!newsList?.length && (
                    <div className="col-span-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground border rounded-lg border-dashed">
                        <p>Keine News vorhanden</p>
                        <p className="text-sm">Erstelle die erste Nachricht über den Button oben rechts.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default NewsManagementPage;
