import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { newsService } from '@/services/newsService';
import { useMarkRead } from '@/context/UnreadContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Loader2, Calendar, MoreVertical, Search, Newspaper } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { CreateNewsDto, UpdateNewsDto } from '@/types';
import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/common/PageHeader';

export function NewsManagementPage() {
    const queryClient = useQueryClient();
    useMarkRead('NEWS');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [editingNews, setEditingNews] = useState<{ id: number; title: string; content: string } | null>(null);
    const [deletingNewsId, setDeletingNewsId] = useState<number | null>(null);
    const [formData, setFormData] = useState({ title: '', content: '' });
    const [searchTerm, setSearchTerm] = useState('');
    const [actionDrawerNews, setActionDrawerNews] = useState<{ id: number; title: string; content: string } | null>(null);

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

    const filteredNews = useMemo(() => {
        if (!newsList) return [];
        if (!searchTerm.trim()) return newsList;
        const q = searchTerm.toLowerCase();
        return newsList.filter((n) =>
            n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
        );
    }, [newsList, searchTerm]);

    if (isLoading) {
        return (
            <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <PageHeader
                title="News Verwaltung"
                subtitle="Aktuelle Nachrichten für die Mitglieder verwalten"
                Icon={Newspaper}
                actions={
                    <Button onClick={() => setIsDialogOpen(true)} className="h-11 w-11 sm:w-auto sm:px-5 gap-1.5 rounded-2xl shadow-sm">
                        <Plus className="h-5 w-5 flex-shrink-0" />
                        <span className="hidden sm:inline">News erstellen</span>
                    </Button>
                }
            />

            {/* Search bar */}
            <div className="native-group p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="News durchsuchen..."
                        className="pl-10 h-11"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) resetForm();
            }}>
                <DialogContent >
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

            {/* News List */}
            {filteredNews.length === 0 ? (
                <EmptyState
                    icon={Newspaper}
                    title={searchTerm ? 'Keine Treffer' : 'Noch keine News'}
                    description={searchTerm ? 'Versuche einen anderen Suchbegriff.' : 'Erstelle die erste Nachricht über den Button oben rechts.'}
                    {...(!searchTerm && {
                        action: {
                            label: 'News erstellen',
                            onClick: () => setIsDialogOpen(true),
                        }
                    })}
                />
            ) : (
                <div className="native-group divide-y divide-border/40">
                    {filteredNews.map((news) => (
                        <div key={news.id} className="flex items-start gap-3 px-4 py-3">
                            {/* Left: icon */}
                            <div className="inset-icon bg-primary/10 flex-shrink-0 mt-0.5">
                                <Newspaper className="h-4 w-4 text-primary" />
                            </div>
                            {/* Center: content */}
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm truncate">{news.title}</p>
                                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{news.content}</p>
                                <p className="text-xs text-muted-foreground/70 mt-1 flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {formatDate((news as any).createdAt)}
                                </p>
                            </div>
                            {/* Right: 3-dots */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 flex-shrink-0"
                                onClick={() => setActionDrawerNews({ id: news.id, title: news.title, content: news.content })}
                            >
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}

            {/* Action Sheet */}
            <Sheet open={!!actionDrawerNews} onOpenChange={(open) => { if (!open) setActionDrawerNews(null); }}>
                <SheetContent side="bottom" className="pb-safe-nav rounded-t-2xl">
                    <SheetHeader className="mb-2">
                        <SheetTitle className="text-left text-base line-clamp-1">{actionDrawerNews?.title}</SheetTitle>
                    </SheetHeader>
                    <div className="divide-y divide-border/40">
                        <Button
                            variant="ghost"
                            className="w-full h-12 justify-start gap-3 text-base font-normal"
                            onClick={() => {
                                if (actionDrawerNews) {
                                    handleEdit(actionDrawerNews);
                                    setActionDrawerNews(null);
                                }
                            }}
                        >
                            <Pencil className="h-4 w-4 text-muted-foreground" />
                            Bearbeiten
                        </Button>
                        <Button
                            variant="ghost"
                            className="w-full h-12 justify-start gap-3 text-base font-normal text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => {
                                if (actionDrawerNews) {
                                    handleDeleteClick(actionDrawerNews.id);
                                    setActionDrawerNews(null);
                                }
                            }}
                        >
                            <Trash2 className="h-4 w-4" />
                            Löschen
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}

export default NewsManagementPage;
