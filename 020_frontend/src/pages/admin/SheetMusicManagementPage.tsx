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
import { Folder, Plus, FileUp, FileDown, Search, Star, Edit2, Trash2 } from 'lucide-react';
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
        <div className="container-app py-8">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">Noten-Verwaltung</h1>
                <p className="text-muted-foreground">
                    Verwalten Sie das Notenarchiv der Musikgesellschaft
                </p>
            </div>

            {/* Filters & Actions */}
            <div className="mb-6 space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Titel, Komponist, Arrangeur suchen..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="pl-10"
                        />
                    </div>

                    {/* Genre Filter */}
                    <Select value={genreFilter || 'all'} onValueChange={setGenreFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Genre" />
                        </SelectTrigger>
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

                    {/* Difficulty Filter */}
                    <Select value={difficultyFilter || 'all'} onValueChange={setDifficultyFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Schwierigkeit" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Alle Schwierigkeiten</SelectItem>
                            <SelectItem value="easy">Leicht</SelectItem>
                            <SelectItem value="medium">Mittel</SelectItem>
                            <SelectItem value="hard">Schwer</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Bookmark Filter */}
                    <Select value={bookmarkedFilter || 'all'} onValueChange={setBookmarkedFilter}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Markiert von" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Alle</SelectItem>
                            <SelectItem value={user?.id.toString() || 'all'}>Meine Markierungen</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Sort */}
                    <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Sortieren" />
                        </SelectTrigger>
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

                {/* Action Buttons */}
                <div className="flex gap-2 flex-wrap">
                    {canManageSheetMusic && (
                        <>
                            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Neue Note
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
                                    <Button variant="outline">
                                        <FileUp className="h-4 w-4 mr-2" />
                                        CSV Import
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
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
                                                    <input
                                                        type="radio"
                                                        checked={csvMode === 'add'}
                                                        onChange={() => setCsvMode('add')}
                                                    />
                                                    <span>Nur neue hinzufügen</span>
                                                </label>
                                                <label className="flex items-center gap-2">
                                                    <input
                                                        type="radio"
                                                        checked={csvMode === 'update'}
                                                        onChange={() => setCsvMode('update')}
                                                    />
                                                    <span>Aktualisieren + Neue hinzufügen</span>
                                                </label>
                                            </div>
                                        </div>

                                        <div>
                                            <Label>Datei hochladen</Label>
                                            <Input
                                                type="file"
                                                accept=".csv"
                                                onChange={handleFileUpload}
                                                className="mt-2"
                                            />
                                        </div>
                                        <div>
                                            <Label>Oder CSV Daten manuell eingeben</Label>
                                            <Textarea
                                                rows={10}
                                                value={csvData}
                                                onChange={(e) => setCsvData(e.target.value)}
                                                placeholder="title,composer,arranger,genre,difficulty,publisher,notes&#10;Test Marsch,Johann Strauss,,,medium,Musikverlag XY,Klassischer Marsch"
                                                className="mt-2"
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button
                                            onClick={() => importCsvMutation.mutate()}
                                            disabled={!csvData || importCsvMutation.isPending}
                                        >
                                            {importCsvMutation.isPending ? 'Importiere...' : 'Importieren'}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </>
                    )}

                    <Button variant="outline" onClick={() => exportMutation.mutate()} disabled={exportMutation.isPending}>
                        <FileDown className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                    <PdfExportDialog
                        trigger={
                            <Button variant="outline" disabled={exportPdfMutation.isPending}>
                                <FileDown className="h-4 w-4 mr-2" />
                                PDF
                            </Button>
                        }
                        title="Notenbestand exportieren"
                        onExport={(opts) => exportPdfMutation.mutate(opts)}
                        isLoading={exportPdfMutation.isPending}
                    />
                </div>
            </div>

            {/* Table */}
            {
                isLoading ? (
                    <div className="text-center py-8">Lädt...</div>
                ) : (
                    <>
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
                                        <TableRow key={sheet.id}>
                                            <TableCell className="font-medium">{sheet.title}</TableCell>
                                            <TableCell>{sheet.composer || '-'}</TableCell>
                                            <TableCell>{sheet.arranger || '-'}</TableCell>
                                            <TableCell>{sheet.genre || '-'}</TableCell>
                                            <TableCell>
                                                {sheet.difficulty ? (
                                                    <Badge
                                                        variant={
                                                            sheet.difficulty === 'easy'
                                                                ? 'secondary'
                                                                : sheet.difficulty === 'medium'
                                                                    ? 'default'
                                                                    : 'destructive'
                                                        }
                                                    >
                                                        {sheet.difficulty === 'easy'
                                                            ? 'Leicht'
                                                            : sheet.difficulty === 'medium'
                                                                ? 'Mittel'
                                                                : 'Schwer'}
                                                    </Badge>
                                                ) : (
                                                    '-'
                                                )}
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
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        size="icon"
                                                        variant={isBookmarkedByMe(sheet) ? 'default' : 'ghost'}
                                                        onClick={() => bookmarkMutation.mutate(sheet.id)}
                                                        disabled={!canBookmarkSheetMusic}
                                                    >
                                                        <Star
                                                            className={`h-4 w-4 ${isBookmarkedByMe(sheet) ? 'fill-white' : ''
                                                                }`}
                                                        />
                                                    </Button>
                                                    {canAddSheetMusicToFolders && (
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            title="Zu Mappe hinzufügen"
                                                            onClick={() => handleAddToFolder(sheet)}
                                                        >
                                                            <Folder className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    {canManageSheetMusic && (
                                                        <>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                onClick={() => handleEdit(sheet)}
                                                            >
                                                                <Edit2 className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                onClick={() => handleDelete(sheet.id, sheet.title)}
                                                            >
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

                        {/* Pagination */}
                        {data && data.pagination.totalPages > 1 && (
                            <div className="flex justify-center gap-2 mt-4">
                                <Button
                                    variant="outline"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage((p) => p - 1)}
                                >
                                    Zurück
                                </Button>
                                <span className="flex items-center px-4">
                                    Seite {currentPage} von {data.pagination.totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    disabled={currentPage === data.pagination.totalPages}
                                    onClick={() => setCurrentPage((p) => p + 1)}
                                >
                                    Weiter
                                </Button>
                            </div>
                        )}
                    </>
                )
            }

            {/* Edit Dialog */}
            {
                selectedSheet && (
                    <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                        <CreateEditDialog
                            title="Note bearbeiten"
                            formData={formData}
                            setFormData={setFormData}
                            onSubmit={() =>
                                updateMutation.mutate({ id: selectedSheet.id, data: formData })
                            }
                            isLoading={updateMutation.isPending}
                            sheetId={selectedSheet.id}
                        />
                    </Dialog>
                )
            }

            {/* Add To Folder Dialog */}
            <Dialog open={addToFolderDialogOpen} onOpenChange={setAddToFolderDialogOpen}>
                {selectedSheetForFolder && (
                    <AddToFolderDialog
                        sheet={selectedSheetForFolder}
                        onSubmit={(folderId) => addToFolderMutation.mutate({ folderId, sheetId: selectedSheetForFolder.id })}
                        isLoading={addToFolderMutation.isPending}
                    />
                )}
            </Dialog>
        </div >
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
