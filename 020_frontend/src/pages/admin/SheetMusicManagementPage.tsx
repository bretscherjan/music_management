import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth, useCan } from '@/context/AuthContext';
import { sheetMusicService } from '@/services';
import { useDebounce } from '@/hooks/useDebounce';
import type {
    SheetMusic,
    CreateSheetMusicDto,
    UpdateSheetMusicDto,
    SheetMusicQueryParams,
    Difficulty,
} from '@/types';
import { getAdminColor } from '@/types/sheetMusic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Folder, Plus, FileUp, FileDown, Search, Star, Edit2, Trash2, MoreVertical, SlidersHorizontal, Music } from 'lucide-react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { PdfExportDialog } from '@/components/ui/PdfExportDialog';
import type { PdfOptions } from '@/utils/pdfTheme';
import { toast } from 'sonner';
import { musicFolderService } from '@/services/musicFolderService';
import { ZoomableTableWrapper } from '@/components/common/ZoomableTableWrapper';

export function SheetMusicManagementPage() {
    const { user } = useAuth();
    const can = useCan();
    const queryClient = useQueryClient();
    const canManageSheetMusic = can('sheetMusic:manage');
    const canBookmarkSheetMusic = can('sheetMusic:write');
    const canAddSheetMusicToFolders = can('folders:write');

    // Filter state
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 500);
    const [genreFilter, setGenreFilter] = useState<string>('all');
    const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
    const [bookmarkedFilter, setBookmarkedFilter] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [sortBy, setSortBy] = useState<string>('title');

    // Dialog states
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [csvDialogOpen, setCsvDialogOpen] = useState(false);
    const [selectedSheet, setSelectedSheet] = useState<SheetMusic | null>(null);

    // Mobile UI state (presentation only)
    const [actionDrawerItem, setActionDrawerItem] = useState<SheetMusic | null>(null);
    const [filterSheetOpen, setFilterSheetOpen] = useState(false);

    // Folder Add Logic
    const [addToFolderDialogOpen, setAddToFolderDialogOpen] = useState(false);
    const [selectedSheetForFolder, setSelectedSheetForFolder] = useState<SheetMusic | null>(null);

    // Form states
    const [formData, setFormData] = useState<CreateSheetMusicDto>({
        title: '',
        composer: '',
        arranger: '',
        genre: '',
        difficulty: undefined,
        publisher: '',
        notes: '',
    });

    const [csvMode, setCsvMode] = useState<'add' | 'update'>('add');
    const [csvData, setCsvData] = useState('');

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            setCsvData(text);
        };
        reader.readAsText(file, 'UTF-8');
    };

    // Build query params
    const queryParams: SheetMusicQueryParams = {
        search: debouncedSearch || undefined,
        genre: genreFilter && genreFilter !== 'all' ? genreFilter : undefined,
        difficulty: difficultyFilter && difficultyFilter !== 'all' ? (difficultyFilter as Difficulty) : undefined,
        bookmarkedBy: bookmarkedFilter && bookmarkedFilter !== 'all' ? parseInt(bookmarkedFilter) : undefined,
        sort: sortBy as any,
        page: currentPage,
        limit: 50,
    };

    // Queries
    const { data, isLoading } = useQuery({
        queryKey: ['sheetMusic', queryParams],
        queryFn: () => sheetMusicService.getAll(queryParams),
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data: CreateSheetMusicDto) => sheetMusicService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sheetMusic'] });
            toast.success('Notenblatt erfolgreich erstellt');
            setCreateDialogOpen(false);
            resetForm();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Fehler beim Erstellen');
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateSheetMusicDto }) =>
            sheetMusicService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sheetMusic'] });
            toast.success('Notenblatt erfolgreich aktualisiert');
            setEditDialogOpen(false);
            setSelectedSheet(null);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Fehler beim Aktualisieren');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => sheetMusicService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sheetMusic'] });
            toast.success('Notenblatt erfolgreich gelöscht');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Fehler beim Löschen');
        },
    });

    const bookmarkMutation = useMutation({
        mutationFn: (id: number) => sheetMusicService.toggleBookmark(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sheetMusic'] });
        },
    });

    const importCsvMutation = useMutation({
        mutationFn: () => sheetMusicService.importCsv({ mode: csvMode, data: csvData }),
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ['sheetMusic'] });
            toast.success(
                `Import abgeschlossen: ${result.imported} neu, ${result.updated} aktualisiert, ${result.errors} Fehler`
            );
            setCsvDialogOpen(false);
            setCsvData('');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Fehler beim Import');
        },
    });

    const exportMutation = useMutation({
        mutationFn: () => sheetMusicService.exportCsv(queryParams),
        onSuccess: (blob) => {
            sheetMusicService.downloadCsvBlob(blob);
            toast.success('CSV erfolgreich exportiert');
        },
        onError: () => {
            toast.error('Fehler beim Export');
        },
    });

    const exportPdfMutation = useMutation({
        mutationFn: (opts: PdfOptions) => sheetMusicService.exportPdf(queryParams, opts),
        onSuccess: (blob) => {
            sheetMusicService.downloadBlob(blob, `noteninventar-${new Date().toISOString().split('T')[0]}.pdf`);
            toast.success('PDF erfolgreich exportiert');
        },
        onError: () => {
            toast.error('Fehler beim PDF Export');
        },
    });

    const addToFolderMutation = useMutation({
        mutationFn: ({ folderId, sheetId }: { folderId: number, sheetId: number }) =>
            musicFolderService.addItems(folderId, [sheetId]),
        onSuccess: () => {
            toast.success('Zu Mappe hinzugefügt');
            setAddToFolderDialogOpen(false);
            setSelectedSheetForFolder(null);
        },
        onError: () => toast.error('Fehler beim Hinzufügen')
    });

    const handleAddToFolder = (sheet: SheetMusic) => {
        setSelectedSheetForFolder(sheet);
        setAddToFolderDialogOpen(true);
    };

    const resetForm = () => {
        setFormData({
            title: '',
            composer: '',
            arranger: '',
            genre: '',
            difficulty: undefined,
            publisher: '',
            notes: '',
        });
    };

    const handleEdit = (sheet: SheetMusic) => {
        setSelectedSheet(sheet);
        setFormData({
            title: sheet.title,
            composer: sheet.composer || '',
            arranger: sheet.arranger || '',
            genre: sheet.genre || '',
            difficulty: sheet.difficulty || undefined,
            publisher: sheet.publisher || '',
            notes: sheet.notes || '',
        });
        setEditDialogOpen(true);
    };

    const handleDelete = (id: number, title: string) => {
        if (confirm(`Möchten Sie "${title}" wirklich löschen?`)) {
            deleteMutation.mutate(id);
        }
    };

    const isBookmarkedByMe = (sheet: SheetMusic) => {
        return sheet.bookmarks?.some((b) => b.userId === user?.id);
    };

    return (
        <div className="space-y-5">
            {/* ── Page Header ── */}
            <div className="flex items-center justify-between gap-4 pt-1">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Noten-Verwaltung</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        {data ? `${data.pagination.total} Stücke im Archiv` : 'Notenarchiv'}
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    {canManageSheetMusic && (
                        <>
                            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm" className="gap-1.5">
                                        <Plus className="h-4 w-4" />
                                        <span className="hidden sm:inline">Neue Note</span>
                                    </Button>
                                </DialogTrigger>
                                <CreateEditDialog
                                    title="Neue Note erstellen"
                                    formData={formData}
                                    setFormData={setFormData}
                                    onSubmit={() => createMutation.mutate(formData)}
                                    isLoading={createMutation.isPending}
                                />
                            </Dialog>

                            <Dialog open={csvDialogOpen} onOpenChange={setCsvDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="gap-1.5 hidden sm:flex">
                                        <FileUp className="h-4 w-4" />
                                        CSV
                                    </Button>
                                </DialogTrigger>
                                <DialogContent size="lg">
                                    <DialogHeader>
                                        <DialogTitle>CSV Import</DialogTitle>
                                        <DialogDescription>
                                            Format: title,composer,arranger,genre,difficulty,publisher,notes
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                        <div>
                                            <Label>Import-Modus</Label>
                                            <div className="flex gap-4 mt-2">
                                                <label className="flex items-center gap-2">
                                                    <input type="radio" checked={csvMode === 'add'} onChange={() => setCsvMode('add')} />
                                                    <span className="text-sm">Nur neue hinzufügen</span>
                                                </label>
                                                <label className="flex items-center gap-2">
                                                    <input type="radio" checked={csvMode === 'update'} onChange={() => setCsvMode('update')} />
                                                    <span className="text-sm">Aktualisieren + Neue hinzufügen</span>
                                                </label>
                                            </div>
                                        </div>
                                        <div>
                                            <Label>Datei hochladen</Label>
                                            <Input type="file" accept=".csv" onChange={handleFileUpload} className="mt-1.5" />
                                        </div>
                                        <div>
                                            <Label>Oder CSV Daten manuell eingeben</Label>
                                            <Textarea
                                                rows={8}
                                                value={csvData}
                                                onChange={(e) => setCsvData(e.target.value)}
                                                placeholder="title,composer,arranger,genre,difficulty,publisher,notes&#10;Test Marsch,Johann Strauss,,,medium,Musikverlag XY,Klassischer Marsch"
                                                className="mt-1.5"
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button onClick={() => importCsvMutation.mutate()} disabled={!csvData || importCsvMutation.isPending}>
                                            {importCsvMutation.isPending ? 'Importiere...' : 'Importieren'}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </>
                    )}
                    <Button variant="outline" size="sm" className="gap-1.5 hidden sm:flex" onClick={() => exportMutation.mutate()} disabled={exportMutation.isPending}>
                        <FileDown className="h-4 w-4" />
                        CSV
                    </Button>
                    <PdfExportDialog
                        trigger={
                            <Button variant="outline" size="sm" className="gap-1.5 hidden sm:flex" disabled={exportPdfMutation.isPending}>
                                <FileDown className="h-4 w-4" />
                                PDF
                            </Button>
                        }
                        title="Notenbestand exportieren"
                        onExport={(opts) => exportPdfMutation.mutate(opts)}
                        isLoading={exportPdfMutation.isPending}
                    />
                </div>
            </div>

            {/* ── Search + Filter ── */}
            <div className="flex gap-2">
                {/* Search — always full width, h-11 */}
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Titel, Komponist, Arrangeur..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                        className="pl-10"
                    />
                </div>

                {/* Mobile: Filter drawer trigger */}
                <Button
                    variant="outline"
                    size="icon"
                    className="md:hidden h-11 w-11 flex-shrink-0"
                    onClick={() => setFilterSheetOpen(true)}
                    title="Filter"
                >
                    <SlidersHorizontal className="h-4 w-4" />
                </Button>

                {/* Desktop: Inline filter selects */}
                <div className="hidden md:flex gap-2 flex-wrap">
                    <Select value={genreFilter || 'all'} onValueChange={setGenreFilter}>
                        <SelectTrigger className="w-[150px]"><SelectValue placeholder="Genre" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Alle Genres</SelectItem>
                            <SelectItem value="Marsch">Marsch</SelectItem>
                            <SelectItem value="Polka">Polka</SelectItem>
                            <SelectItem value="Walzer">Walzer</SelectItem>
                            <SelectItem value="Pop">Pop</SelectItem>
                            <SelectItem value="Rock">Rock</SelectItem>
                            <SelectItem value="Filmmusik">Filmmusik</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={difficultyFilter || 'all'} onValueChange={setDifficultyFilter}>
                        <SelectTrigger className="w-[160px]"><SelectValue placeholder="Schwierigkeit" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Alle Schwierigkeiten</SelectItem>
                            <SelectItem value="easy">Leicht</SelectItem>
                            <SelectItem value="medium">Mittel</SelectItem>
                            <SelectItem value="hard">Schwer</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={bookmarkedFilter || 'all'} onValueChange={setBookmarkedFilter}>
                        <SelectTrigger className="w-[180px]"><SelectValue placeholder="Markiert von" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Alle</SelectItem>
                            <SelectItem value={user?.id.toString() || 'all'}>Meine Markierungen</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-[150px]"><SelectValue placeholder="Sortieren" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="title">Titel</SelectItem>
                            <SelectItem value="composer">Komponist</SelectItem>
                            <SelectItem value="arranger">Arrangeur</SelectItem>
                            <SelectItem value="genre">Genre</SelectItem>
                            <SelectItem value="difficulty">Schwierigkeit</SelectItem>
                            <SelectItem value="createdAt">Neueste</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* ── Mobile Filter Drawer ── */}
            <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
                <SheetContent side="bottom" className="pb-safe-nav space-y-4">
                    <SheetHeader>
                        <SheetTitle>Filter &amp; Sortierung</SheetTitle>
                    </SheetHeader>
                    <div className="space-y-3 pt-2">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Genre</label>
                            <Select value={genreFilter || 'all'} onValueChange={setGenreFilter}>
                                <SelectTrigger className="w-full"><SelectValue placeholder="Genre" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Alle Genres</SelectItem>
                                    <SelectItem value="Marsch">Marsch</SelectItem>
                                    <SelectItem value="Polka">Polka</SelectItem>
                                    <SelectItem value="Walzer">Walzer</SelectItem>
                                    <SelectItem value="Pop">Pop</SelectItem>
                                    <SelectItem value="Rock">Rock</SelectItem>
                                    <SelectItem value="Filmmusik">Filmmusik</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Schwierigkeit</label>
                            <Select value={difficultyFilter || 'all'} onValueChange={setDifficultyFilter}>
                                <SelectTrigger className="w-full"><SelectValue placeholder="Schwierigkeit" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Alle Schwierigkeiten</SelectItem>
                                    <SelectItem value="easy">Leicht</SelectItem>
                                    <SelectItem value="medium">Mittel</SelectItem>
                                    <SelectItem value="hard">Schwer</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Markierungen</label>
                            <Select value={bookmarkedFilter || 'all'} onValueChange={setBookmarkedFilter}>
                                <SelectTrigger className="w-full"><SelectValue placeholder="Markiert von" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Alle</SelectItem>
                                    <SelectItem value={user?.id.toString() || 'all'}>Meine Markierungen</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Sortieren nach</label>
                            <Select value={sortBy} onValueChange={setSortBy}>
                                <SelectTrigger className="w-full"><SelectValue placeholder="Sortieren" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="title">Titel</SelectItem>
                                    <SelectItem value="composer">Komponist</SelectItem>
                                    <SelectItem value="arranger">Arrangeur</SelectItem>
                                    <SelectItem value="genre">Genre</SelectItem>
                                    <SelectItem value="difficulty">Schwierigkeit</SelectItem>
                                    <SelectItem value="createdAt">Neueste</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button className="w-full mt-2" onClick={() => setFilterSheetOpen(false)}>
                            Anwenden
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>

            {/* ── Data / Loading ── */}
            {isLoading ? (
                <div className="native-group divide-y divide-border/40">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex items-center gap-3 px-4 py-3">
                            <div className="h-9 w-9 rounded-lg bg-muted animate-pulse flex-shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 w-2/3 rounded bg-muted animate-pulse" />
                                <div className="h-3 w-1/3 rounded bg-muted animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <>
                    {/* ── Mobile: Action-Card List ── */}
                    <div className="md:hidden native-group divide-y divide-border/40">
                        {!data?.sheetMusic.length ? (
                            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                                Keine Noten gefunden
                            </div>
                        ) : (
                            data.sheetMusic.map((sheet) => {
                                const bookmarked = isBookmarkedByMe(sheet);
                                const meta = [sheet.composer, sheet.genre].filter(Boolean).join(' · ');
                                return (
                                    <div key={sheet.id} className="flex items-center gap-3 px-4 py-3">
                                        {/* Icon */}
                                        <div className="inset-icon bg-primary/10 flex-shrink-0">
                                            <Music className="h-4 w-4 text-primary" />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm truncate leading-tight">{sheet.title}</p>
                                            {meta && (
                                                <p className="text-xs text-muted-foreground truncate mt-0.5">{meta}</p>
                                            )}
                                            {sheet.difficulty && (
                                                <span className={`inline-block mt-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                                                    sheet.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                                                    sheet.difficulty === 'medium' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                    {sheet.difficulty === 'easy' ? 'Leicht' : sheet.difficulty === 'medium' ? 'Mittel' : 'Schwer'}
                                                </span>
                                            )}
                                        </div>

                                        {/* Bookmark quick-toggle */}
                                        {canBookmarkSheetMusic && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-9 w-9 flex-shrink-0"
                                                onClick={() => bookmarkMutation.mutate(sheet.id)}
                                                title={bookmarked ? 'Markierung entfernen' : 'Markieren'}
                                            >
                                                <Star className={`h-4 w-4 ${bookmarked ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
                                            </Button>
                                        )}

                                        {/* 3-dots action menu */}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 flex-shrink-0"
                                            onClick={() => setActionDrawerItem(sheet)}
                                            title="Aktionen"
                                        >
                                            <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* ── Desktop: Sticky-header table ── */}
                    <div className="hidden md:block native-group overflow-hidden">
                        <ZoomableTableWrapper title="Notenbestand">
                            <Table className="min-w-[800px]">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Titel</TableHead>
                                        <TableHead>Komponist</TableHead>
                                        <TableHead>Arrangeur</TableHead>
                                        <TableHead>Genre</TableHead>
                                        <TableHead>Schwierigkeit</TableHead>
                                        <TableHead>Verlag</TableHead>
                                        <TableHead>Markierungen</TableHead>
                                        <TableHead className="text-right">Aktionen</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data?.sheetMusic.map((sheet) => (
                                        <TableRow key={sheet.id} className="h-12">
                                            <TableCell className="font-medium">{sheet.title}</TableCell>
                                            <TableCell>{sheet.composer || '-'}</TableCell>
                                            <TableCell>{sheet.arranger || '-'}</TableCell>
                                            <TableCell>{sheet.genre || '-'}</TableCell>
                                            <TableCell>
                                                {sheet.difficulty ? (
                                                    <Badge variant={sheet.difficulty === 'easy' ? 'secondary' : sheet.difficulty === 'medium' ? 'default' : 'destructive'}>
                                                        {sheet.difficulty === 'easy' ? 'Leicht' : sheet.difficulty === 'medium' ? 'Mittel' : 'Schwer'}
                                                    </Badge>
                                                ) : '-'}
                                            </TableCell>
                                            <TableCell>{sheet.publisher || '-'}</TableCell>
                                            <TableCell>
                                                <div className="flex gap-1">
                                                    {sheet.bookmarks?.map((bookmark) => (
                                                        <div
                                                            key={bookmark.id}
                                                            title={`${bookmark.user.firstName} ${bookmark.user.lastName}`}
                                                            className="w-6 h-6 rounded-full flex items-center justify-center"
                                                            style={{ backgroundColor: getAdminColor(bookmark.userId) }}
                                                        >
                                                            <Star className="h-3 w-3 text-white fill-white" />
                                                        </div>
                                                    ))}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button size="icon" variant={isBookmarkedByMe(sheet) ? 'default' : 'ghost'} onClick={() => bookmarkMutation.mutate(sheet.id)} disabled={!canBookmarkSheetMusic} title="Markierung">
                                                        <Star className={`h-4 w-4 ${isBookmarkedByMe(sheet) ? 'fill-white' : ''}`} />
                                                    </Button>
                                                    {canAddSheetMusicToFolders && (
                                                        <Button size="icon" variant="ghost" title="Zu Mappe hinzufügen" onClick={() => handleAddToFolder(sheet)}>
                                                            <Folder className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    {canManageSheetMusic && (
                                                        <>
                                                            <Button size="icon" variant="ghost" onClick={() => handleEdit(sheet)}>
                                                                <Edit2 className="h-4 w-4" />
                                                            </Button>
                                                            <Button size="icon" variant="ghost" onClick={() => handleDelete(sheet.id, sheet.title)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ZoomableTableWrapper>
                    </div>

                    {/* Pagination */}
                    {data && data.pagination.totalPages > 1 && (
                        <div className="flex justify-center gap-2 mt-2">
                            <Button variant="outline" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>
                                Zurück
                            </Button>
                            <span className="flex items-center px-4 text-sm text-muted-foreground">
                                Seite {currentPage} von {data.pagination.totalPages}
                            </span>
                            <Button variant="outline" disabled={currentPage === data.pagination.totalPages} onClick={() => setCurrentPage((p) => p + 1)}>
                                Weiter
                            </Button>
                        </div>
                    )}
                </>
            )}

            {/* ── Mobile Action Drawer (3-dots) ── */}
            <Sheet open={!!actionDrawerItem} onOpenChange={(open) => { if (!open) setActionDrawerItem(null); }}>
                <SheetContent side="bottom" className="pb-safe-nav">
                    <SheetHeader>
                        <SheetTitle className="truncate text-base">{actionDrawerItem?.title}</SheetTitle>
                        {actionDrawerItem?.composer && (
                            <p className="text-sm text-muted-foreground -mt-1">{actionDrawerItem.composer}</p>
                        )}
                    </SheetHeader>
                    <div className="space-y-1 pt-4">
                        {canBookmarkSheetMusic && actionDrawerItem && (
                            <Button
                                variant="ghost"
                                className="w-full justify-start gap-3 h-12 text-base"
                                onClick={() => { bookmarkMutation.mutate(actionDrawerItem.id); setActionDrawerItem(null); }}
                            >
                                <Star className={`h-5 w-5 ${isBookmarkedByMe(actionDrawerItem) ? 'fill-primary text-primary' : ''}`} />
                                {isBookmarkedByMe(actionDrawerItem) ? 'Markierung entfernen' : 'Markieren'}
                            </Button>
                        )}
                        {canAddSheetMusicToFolders && actionDrawerItem && (
                            <Button
                                variant="ghost"
                                className="w-full justify-start gap-3 h-12 text-base"
                                onClick={() => { handleAddToFolder(actionDrawerItem); setActionDrawerItem(null); }}
                            >
                                <Folder className="h-5 w-5" />
                                Zu Mappe hinzufügen
                            </Button>
                        )}
                        {canManageSheetMusic && actionDrawerItem && (
                            <>
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start gap-3 h-12 text-base"
                                    onClick={() => { handleEdit(actionDrawerItem); setActionDrawerItem(null); }}
                                >
                                    <Edit2 className="h-5 w-5" />
                                    Bearbeiten
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start gap-3 h-12 text-base text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => { handleDelete(actionDrawerItem.id, actionDrawerItem.title); setActionDrawerItem(null); }}
                                >
                                    <Trash2 className="h-5 w-5" />
                                    Löschen
                                </Button>
                            </>
                        )}
                    </div>
                </SheetContent>
            </Sheet>

            {/* ── Edit Dialog ── */}
            {selectedSheet && (
                <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                    <CreateEditDialog
                        title="Note bearbeiten"
                        formData={formData}
                        setFormData={setFormData}
                        onSubmit={() => updateMutation.mutate({ id: selectedSheet.id, data: formData })}
                        isLoading={updateMutation.isPending}
                        sheetId={selectedSheet.id}
                    />
                </Dialog>
            )}

            {/* ── Add To Folder Dialog ── */}
            <Dialog open={addToFolderDialogOpen} onOpenChange={setAddToFolderDialogOpen}>
                {selectedSheetForFolder && (
                    <AddToFolderDialog
                        sheet={selectedSheetForFolder}
                        onSubmit={(folderId) => addToFolderMutation.mutate({ folderId, sheetId: selectedSheetForFolder.id })}
                        isLoading={addToFolderMutation.isPending}
                    />
                )}
            </Dialog>
        </div>
    );
}

// CreateEditDialog Component
interface CreateEditDialogProps {
    title: string;
    formData: CreateSheetMusicDto;
    setFormData: (data: CreateSheetMusicDto) => void;
    onSubmit: () => void;
    isLoading: boolean;
    sheetId?: number; // Added to enable file management in edit mode
}

function CreateEditDialog({
    title,
    formData,
    setFormData,
    onSubmit,
    isLoading,
}: CreateEditDialogProps) {




    return (
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
            </DialogHeader>
            <div className="grid md:grid-cols-1 gap-6">
                <div className="space-y-4">
                    <h3 className="font-medium border-b pb-2">Metadaten</h3>
                    <div>
                        <Label>Titel *</Label>
                        <Input
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Komponist</Label>
                            <Input
                                value={formData.composer}
                                onChange={(e) => setFormData({ ...formData, composer: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label>Arrangeur</Label>
                            <Input
                                value={formData.arranger}
                                onChange={(e) => setFormData({ ...formData, arranger: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Genre</Label>
                            <Input
                                value={formData.genre}
                                onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label>Schwierigkeit</Label>
                            <Select
                                value={formData.difficulty}
                                onValueChange={(val) =>
                                    setFormData({ ...formData, difficulty: val as Difficulty })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Wählen..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="easy">Leicht</SelectItem>
                                    <SelectItem value="medium">Mittel</SelectItem>
                                    <SelectItem value="hard">Schwer</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div>
                        <Label>Verlag/Quelle</Label>
                        <Input
                            value={formData.publisher}
                            onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                        />
                    </div>
                    <div>
                        <Label>Notizen/Bemerkungen</Label>
                        <Textarea
                            rows={4}
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>
                </div>

            </div>

            <DialogFooter>
                <Button onClick={onSubmit} disabled={!formData.title || isLoading}>
                    {isLoading ? 'Speichere...' : 'Speichern'}
                </Button>
            </DialogFooter>
        </DialogContent>
    );
}

// AddToFolderDialog Component
function AddToFolderDialog({ sheet, onSubmit, isLoading }: { sheet: SheetMusic, onSubmit: (folderId: number) => void, isLoading: boolean }) {
    const { data: folders } = useQuery({
        queryKey: ['musicFolders'],
        queryFn: musicFolderService.getAll
    });

    const [selectedFolderId, setSelectedFolderId] = useState<string>('');

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>"{sheet.title}" zu Mappe hinzufügen</DialogTitle>
            </DialogHeader>
            <div className="py-4">
                <Label>Mappe wählen</Label>
                <Select value={selectedFolderId} onValueChange={setSelectedFolderId}>
                    <SelectTrigger>
                        <SelectValue placeholder="Mappe wählen..." />
                    </SelectTrigger>
                    <SelectContent>
                        {folders?.map(f => (
                            <SelectItem key={f.id} value={f.id.toString()}>{f.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <DialogFooter>
                <Button onClick={() => onSubmit(parseInt(selectedFolderId))} disabled={!selectedFolderId || isLoading}>
                    Hinzufügen
                </Button>
            </DialogFooter>
        </DialogContent>
    );
}
