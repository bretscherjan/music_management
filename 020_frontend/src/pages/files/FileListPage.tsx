import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import {
    MoreVertical,
    Shield,
    Download,
    Upload,
    FileText,
    Folder,
    Home,
    ChevronRight,
    Trash2,
    Loader2,
    FolderPlus,
    CornerUpLeft,
    Eye,
    CheckSquare,
    Square,
    FolderInput,
    Pencil,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useIsAdmin } from '@/context/AuthContext';
import { fileService } from '@/services/fileService';
import { formatFileSize } from '@/lib/utils';
import type { FileEntity } from '@/types';
import { FileUploadDialog } from '@/components/files/FileUploadDialog';
import { CreateFolderDialog } from '@/components/files/CreateFolderDialog';
import { ManageAccessDialog } from '@/components/files/ManageAccessDialog';
import { ManageFolderAccessDialog } from '@/components/files/ManageFolderAccessDialog';
import { ManageBulkAccessDialog } from '@/components/files/ManageBulkAccessDialog';
import { FilePreviewDialog } from '@/components/files/FilePreviewDialog';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { MoveItemDialog } from '@/components/files/MoveItemDialog';
import { WrapInFolderDialog } from '@/components/files/WrapInFolderDialog';
import { RenameFolderDialog } from '@/components/files/RenameFolderDialog';
import { Checkbox } from '@/components/ui/checkbox';

export function FileListPage() {
    const isAdmin = useIsAdmin();
    const queryClient = useQueryClient();
    const [searchParams, setSearchParams] = useSearchParams();
    const folderParam = searchParams.get('folder');
    const fileIdParam = searchParams.get('fileId');

    // URL is the single source of truth for folder navigation.
    const parsedFolderId = folderParam !== null ? parseInt(folderParam, 10) : NaN;
    const currentFolderId: number | null = Number.isNaN(parsedFolderId) ? null : parsedFolderId;

    const [downloading, setDownloading] = useState<number | null>(null);
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
    const [manageAccessFile, setManageAccessFile] = useState<FileEntity | null>(null);
    const [manageAccessFolder, setManageAccessFolder] = useState<any | null>(null);
    const [deleteFileId, setDeleteFileId] = useState<number | null>(null);
    const [deleteFolderId, setDeleteFolderId] = useState<number | null>(null);
    const [previewFileId, setPreviewFileId] = useState<number | null>(null);

    // Move state
    const [moveItem, setMoveItem] = useState<{ id: number; type: 'file' | 'folder'; name: string } | null>(null);
    const [renameFolder, setRenameFolder] = useState<{ id: number; name: string } | null>(null);
    const [isWrapInFolderOpen, setIsWrapInFolderOpen] = useState(false);

    // Bulk selection state
    const [selectedFileIds, setSelectedFileIds] = useState<number[]>([]);
    const [selectedFolderIds, setSelectedFolderIds] = useState<number[]>([]);
    const [isBulkAccessOpen, setIsBulkAccessOpen] = useState(false);

    const { data: folderContents, isLoading, error: folderError } = useQuery({
        queryKey: ['folderContents', currentFolderId],
        queryFn: () => fileService.getFolderContents(currentFolderId ?? 'root'),
    });

    const updateFolderInUrl = useCallback((
        folderId: number | null,
        options?: { replace?: boolean; clearFileId?: boolean }
    ) => {
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            if (folderId === null) {
                next.delete('folder');
            } else {
                next.set('folder', folderId.toString());
            }

            if (options?.clearFileId) {
                next.delete('fileId');
            }

            return next;
        }, { replace: options?.replace ?? false });
    }, [setSearchParams]);

    // Handle file highlighting
    useEffect(() => {
        if (fileIdParam && folderContents) {
            const timer = setTimeout(() => {
                const element = document.getElementById(`file-${fileIdParam}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    element.classList.add('ring-2', 'ring-primary', 'ring-offset-2', 'transition-all');
                    setTimeout(() => {
                        element.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
                    }, 5000);
                }
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [fileIdParam, folderContents]);

    // If fileId is provided but we are in the wrong folder, we need to find its parent folder
    const { data: fileInfo } = useQuery({
        queryKey: ['fileInfo', fileIdParam],
        queryFn: () => fileService.getInfo(parseInt(fileIdParam!)),
        enabled: !!fileIdParam && (!folderContents?.files.find((f: any) => f.id === parseInt(fileIdParam!)))
    });

    const resolvedFileFolderId: number | null | undefined = fileInfo
        ? ((fileInfo as any).folderId ?? (fileInfo as any).folder?.id ?? null)
        : undefined;

    useEffect(() => {
        if (resolvedFileFolderId !== undefined) {
            if (resolvedFileFolderId !== currentFolderId) {
                // Keep browser history clean for automatic deep-link correction.
                updateFolderInUrl(resolvedFileFolderId, { replace: true });
            }
        }
    }, [resolvedFileFolderId, currentFolderId, updateFolderInUrl]);

    const deleteFileMutation = useMutation({
        mutationFn: (id: number) => fileService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['folderContents'] });
            setDeleteFileId(null);
        },
    });

    const deleteFolderMutation = useMutation({
        mutationFn: (id: number) => fileService.deleteFolder(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['folderContents'] });
            setDeleteFolderId(null);
        },
    });

    const handleDownload = async (id: number, name: string) => {
        setDownloading(id);
        const toastId = toast.loading(`${name} wird heruntergeladen...`);
        try {
            await fileService.downloadAndSave(id, name);
            toast.success(`${name} heruntergeladen`, { id: toastId });
        } catch (error: any) {
            console.error('Download failed:', error);
            const msg = error.response?.data?.message || 'Download fehlgeschlagen';
            toast.error(msg, { id: toastId });
        } finally {
            setDownloading(null);
        }
    };

    const handlePreview = (id: number) => {
        setPreviewFileId(id);
    };

    const handleDeleteFile = () => {
        if (deleteFileId) {
            deleteFileMutation.mutate(deleteFileId);
        }
    };

    const handleDeleteFolder = () => {
        if (deleteFolderId) {
            deleteFolderMutation.mutate(deleteFolderId);
        }
    };

    const navigateToFolder = (folderId: number | null) => {
        // Manual navigation should drop fileId, otherwise deep-link auto-correction can override navigation.
        updateFolderInUrl(folderId, { clearFileId: true });
    };

    const navigateUp = () => {
        if (folderContents?.currentFolder?.parentId !== undefined) {
            navigateToFolder(folderContents.currentFolder.parentId);
        } else {
            navigateToFolder(null);
        }
    };

    const toggleFileSelection = (id: number) => {
        setSelectedFileIds(prev =>
            prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
        );
    };

    const toggleFolderSelection = (id: number) => {
        setSelectedFolderIds(prev =>
            prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
        );
    };

    const clearSelection = () => {
        setSelectedFileIds([]);
        setSelectedFolderIds([]);
    };

    const toggleSelectAll = () => {
        if (selectedFileIds.length + selectedFolderIds.length === files.length + folders.length) {
            setSelectedFileIds([]);
            setSelectedFolderIds([]);
        } else {
            setSelectedFileIds(files.map(f => f.id));
            setSelectedFolderIds(folders.map(f => f.id));
        }
    };

    const getFileIcon = (mimetype: string) => {
        if (mimetype.includes('pdf')) return '📄';
        if (mimetype.includes('word')) return '📄';
        if (mimetype.includes('excel')) return '📊';
        if (mimetype.includes('powerpoint')) return '📈';
        if (mimetype.includes('image')) return '🖼️';
        if (mimetype.includes('audio')) return '🎵';
        if (mimetype.includes('video')) return '🎬';
        return '📄';
    };

    const folders = folderContents?.folders || [];
    const files = folderContents?.files || [];
    const breadcrumbs = folderContents?.breadcrumbs || [];
    const currentFolderName = folderContents?.currentFolder?.name || 'Root';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <FileText className="h-8 w-8" />
                        Dateien
                    </h1>
                    <p className="text-muted-foreground">
                        Noten, Dokumente und andere Dateien zum Download
                    </p>
                </div>

                {isAdmin && (
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setIsCreateFolderOpen(true)}>
                            <FolderPlus className="h-4 w-4 mr-2" />
                            Ordner erstellen
                        </Button>
                        <Button onClick={() => setIsUploadOpen(true)}>
                            <Upload className="h-4 w-4 mr-2" />
                            Datei hochladen
                        </Button>
                    </div>
                )}
            </div>

            {/* Breadcrumb Navigation */}
            <div className="flex items-center flex-wrap gap-2 text-sm bg-muted/20 p-2 rounded-md">
                <button
                    onClick={() => navigateToFolder(null)}
                    className={`flex items-center gap-1 hover:text-primary transition-colors ${currentFolderId === null ? 'font-bold text-primary' : ''}`}
                >
                    <Home className="h-4 w-4" />
                    <span>Root</span>
                </button>

                {breadcrumbs.map((crumb: any) => (
                    <div key={crumb.id} className="flex items-center gap-2">
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        <button
                            onClick={() => navigateToFolder(crumb.id)}
                            className="hover:text-primary transition-colors"
                        >
                            {crumb.name}
                        </button>
                    </div>
                ))}
            </div>

            {/* Back Button if not root */}
            {currentFolderId !== null && (
                <Button variant="ghost" size="sm" onClick={navigateUp} className="mb-2">
                    <CornerUpLeft className="h-4 w-4 mr-2" />
                    Ebene höher
                </Button>
            )}

            {/* Content */}
            {isLoading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <Card key={i}>
                            <CardContent className="p-6">
                                <Skeleton className="h-6 w-3/4 mb-2" />
                                <Skeleton className="h-4 w-1/2" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : folderError ? (
                <Card>
                    <CardContent className="p-12 text-center">
                        <p className="text-destructive font-medium mb-3">Fehler beim Laden der Dateien</p>
                        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                            Erneut versuchen
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center justify-between gap-2 overflow-hidden">
                            <div className="flex items-center gap-2 overflow-hidden">
                                <Folder className="h-5 w-5 fill-musig-contrast/20 text-musig-contrast shrink-0" />
                                <span className="truncate">{currentFolderName}</span>
                            </div>

                            {isAdmin && (files.length > 0 || folders.length > 0) && (
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={toggleSelectAll}
                                        className="text-xs h-8 px-2"
                                    >
                                        {selectedFileIds.length + selectedFolderIds.length === files.length + folders.length
                                            ? <CheckSquare className="h-4 w-4 mr-1.5" />
                                            : <Square className="h-4 w-4 mr-1.5" />
                                        }
                                        Alle {selectedFileIds.length + selectedFolderIds.length > 0 ? 'abwählen' : 'auswählen'}
                                    </Button>
                                </div>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {/* Subfolders */}
                            {folders.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Ordner</h4>
                                    {folders.map((folder: any) => (
                                        <div
                                            key={folder.id}
                                            id={`folder-${folder.id}`}
                                            className={`flex items-center justify-between p-3 rounded-lg transition-colors group relative border ${selectedFolderIds.includes(folder.id) ? 'bg-primary/10 border-primary/20' : 'bg-muted/30 hover:bg-muted/50 border-transparent'}`}
                                        >
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                {isAdmin && (
                                                    <div className="flex items-center justify-center p-1" onClick={(e) => e.stopPropagation()}>
                                                        <Checkbox
                                                            id={`folder-${folder.id}`}
                                                            checked={selectedFolderIds.includes(folder.id)}
                                                            onCheckedChange={() => toggleFolderSelection(folder.id)}
                                                            className="h-5 w-5"
                                                        />
                                                    </div>
                                                )}
                                                <div
                                                    className="flex items-center gap-3 flex-1 cursor-pointer overflow-hidden"
                                                    onClick={() => navigateToFolder(folder.id)}
                                                >
                                                    <Folder className="h-10 w-10 fill-primary/20 text-primary transition-transform group-hover:scale-110 shrink-0" />
                                                    <div className="flex flex-col overflow-hidden">
                                                        <span className="font-medium text-base truncate">{folder.name}</span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {(folder._count?.files || 0) + (folder._count?.children || 0)} Objekte
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <ChevronRight className="h-4 w-4 text-muted-foreground mr-2" />
                                                {isAdmin && (
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <span className="sr-only">Open menu</span>
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Aktionen</DropdownMenuLabel>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem onClick={() => setRenameFolder({ id: folder.id, name: folder.name })}>
                                                                <Pencil className="mr-2 h-4 w-4" />
                                                                Umbenennen
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => setMoveItem({ id: folder.id, type: 'folder', name: folder.name })}>
                                                                <FolderInput className="mr-2 h-4 w-4" />
                                                                Verschieben
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => setManageAccessFolder(folder)}>
                                                                <Shield className="mr-2 h-4 w-4" />
                                                                Berechtigungen
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => setDeleteFolderId(folder.id)}
                                                                className="text-red-600 focus:text-red-600"
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Löschen
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Files */}
                            {files.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Dateien</h4>
                                    {files.map((file: FileEntity) => (
                                        <div
                                            key={file.id}
                                            id={`file-${file.id}`}
                                            className={`flex items-center justify-between p-3 rounded-lg transition-colors border group relative ${selectedFileIds.includes(file.id)
                                                ? 'bg-primary/10 border-primary/30'
                                                : 'hover:bg-accent/50 border-transparent hover:border-border'} cursor-pointer`}
                                            onClick={() => handlePreview(file.id)}
                                        >
                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                                {isAdmin && (
                                                    <div className="flex items-center justify-center p-1" onClick={(e) => e.stopPropagation()}>
                                                        <Checkbox
                                                            id={`file-${file.id}`}
                                                            checked={selectedFileIds.includes(file.id)}
                                                            onCheckedChange={() => toggleFileSelection(file.id)}
                                                            className="h-5 w-5"
                                                        />
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                                    <span className="text-2xl flex-shrink-0">{getFileIcon(file.mimetype)}</span>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-medium truncate transition-colors">{file.originalName}</p>
                                                        <div className="flex gap-2 text-xs text-muted-foreground">
                                                            <span>{formatFileSize(file.size)}</span>
                                                            {file.visibility !== 'all' && (
                                                                <Badge variant="outline" className="text-[10px] h-4 py-0 flex items-center gap-1 border-primary/30">
                                                                    <Shield className="h-3 w-3" />
                                                                    {file.visibility === 'admin' ? 'Admins' : 'Limit'}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDownload(file.id, file.originalName);
                                                    }}
                                                    disabled={downloading === file.id}
                                                >
                                                    {downloading === file.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Download className="h-4 w-4" />
                                                    )}
                                                </Button>

                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Aktionen</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => handlePreview(file.id)}>
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            Vorschau
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleDownload(file.id, file.originalName)}
                                                            disabled={downloading === file.id}
                                                        >
                                                            {downloading === file.id ? (
                                                                <Loader2 className="mr-2 h-4 w-4 animate-spin text-muted-foreground" />
                                                            ) : (
                                                                <Download className="mr-2 h-4 w-4" />
                                                            )}
                                                            Herunterladen
                                                        </DropdownMenuItem>

                                                        {isAdmin && (
                                                            <>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem onClick={() => setMoveItem({ id: file.id, type: 'file', name: file.originalName })}>
                                                                    <FolderInput className="mr-2 h-4 w-4" />
                                                                    Verschieben
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => setManageAccessFile(file)}>
                                                                    <Shield className="mr-2 h-4 w-4" />
                                                                    Berechtigungen
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={() => setDeleteFileId(file.id)}
                                                                    className="text-red-600 focus:text-red-600"
                                                                >
                                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                                    Löschen
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {files.length === 0 && folders.length === 0 && (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Folder className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                    <p>Dieser Ordner ist leer</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Bulk Action Toolbar */}
            {isAdmin && (selectedFileIds.length > 0 || selectedFolderIds.length > 0) && (
                <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <Card className="shadow-2xl border-primary/20 bg-background/95 backdrop-blur-sm">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="flex items-center gap-2 px-2 border-r pr-4">
                                <Badge variant="default" className="bg-primary hover:bg-primary px-2 py-0.5">
                                    {selectedFileIds.length + selectedFolderIds.length}
                                </Badge>
                                <span className="text-sm font-medium whitespace-nowrap">ausgewählt</span>
                                <Button variant="ghost" size="sm" onClick={clearSelection} className="h-7 text-xs px-2">
                                    Aufheben
                                </Button>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button size="sm" onClick={() => setIsBulkAccessOpen(true)} className="h-9">
                                    <Shield className="h-4 w-4 mr-2" />
                                    Berechtigungen setzen
                                </Button>

                                <Button size="sm" variant="outline" onClick={() => setIsWrapInFolderOpen(true)} className="h-9">
                                    <FolderPlus className="h-4 w-4 mr-2" />
                                    In Ordner einpacken
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Dialogs */}
            <FileUploadDialog
                open={isUploadOpen}
                onOpenChange={setIsUploadOpen}
                currentFolderId={currentFolderId}
                currentFolderName={currentFolderName}
            />

            <CreateFolderDialog
                open={isCreateFolderOpen}
                onOpenChange={setIsCreateFolderOpen}
                currentFolderId={currentFolderId}
                currentFolderName={currentFolderName}
            />

            {manageAccessFile && (
                <ManageAccessDialog
                    file={manageAccessFile}
                    open={!!manageAccessFile}
                    onOpenChange={(open) => !open && setManageAccessFile(null)}
                />
            )}

            {manageAccessFolder && (
                <ManageFolderAccessDialog
                    folder={manageAccessFolder}
                    open={!!manageAccessFolder}
                    onOpenChange={(open) => !open && setManageAccessFolder(null)}
                />
            )}

            {isBulkAccessOpen && (
                <ManageBulkAccessDialog
                    selectedFileIds={selectedFileIds}
                    selectedFolderIds={selectedFolderIds}
                    open={isBulkAccessOpen}
                    onOpenChange={setIsBulkAccessOpen}
                />
            )}

            <FilePreviewDialog
                files={folderContents?.files ?? []}
                initialFileId={previewFileId}
                open={!!previewFileId}
                onOpenChange={(open) => !open && setPreviewFileId(null)}
            />

            <ConfirmDialog
                open={!!deleteFileId}
                onOpenChange={(open) => !open && setDeleteFileId(null)}
                title="Datei löschen"
                description="Bist du sicher, dass du diese Datei löschen möchtest? Dies kann nicht rückgängig gemacht werden."
                onConfirm={handleDeleteFile}
                variant="destructive"
            />

            <ConfirmDialog
                open={!!deleteFolderId}
                onOpenChange={(open) => !open && setDeleteFolderId(null)}
                title="Ordner löschen"
                description="Bist du sicher, dass du diesen Ordner und alle darin enthaltenen Dateien löschen möchtest?"
                onConfirm={handleDeleteFolder}
                variant="destructive"
            />

            <MoveItemDialog
                itemId={moveItem?.id ?? null}
                itemType={moveItem?.type ?? 'file'}
                itemName={moveItem?.name}
                currentFolderId={currentFolderId}
                open={!!moveItem}
                onOpenChange={(open) => !open && setMoveItem(null)}
            />

            <WrapInFolderDialog
                open={isWrapInFolderOpen}
                onOpenChange={setIsWrapInFolderOpen}
                selectedFileIds={selectedFileIds}
                selectedFolderIds={selectedFolderIds}
                currentFolderId={currentFolderId}
                currentFolderName={folderContents?.currentFolder?.name ?? 'Root'}
                onDone={() => {
                    queryClient.invalidateQueries({ queryKey: ['folderContents'] });
                    clearSelection();
                    setIsWrapInFolderOpen(false);
                }}
            />

            <RenameFolderDialog
                folder={renameFolder}
                open={!!renameFolder}
                onOpenChange={(open) => !open && setRenameFolder(null)}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['folderContents'] });
                }}
            />
        </div>
    );
}
