import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
    Square
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

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
import { Checkbox } from '@/components/ui/checkbox';

export function FileListPage() {
    const isAdmin = useIsAdmin();
    const queryClient = useQueryClient();

    // State now tracks Folder ID (null = root)
    const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);

    const [downloading, setDownloading] = useState<number | null>(null);
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
    const [manageAccessFile, setManageAccessFile] = useState<FileEntity | null>(null);
    const [manageAccessFolder, setManageAccessFolder] = useState<any | null>(null);
    const [deleteFileId, setDeleteFileId] = useState<number | null>(null);
    const [deleteFolderId, setDeleteFolderId] = useState<number | null>(null);
    const [previewFileId, setPreviewFileId] = useState<number | null>(null);

    // Bulk selection state
    const [selectedFileIds, setSelectedFileIds] = useState<number[]>([]);
    const [selectedFolderIds, setSelectedFolderIds] = useState<number[]>([]);
    const [isBulkAccessOpen, setIsBulkAccessOpen] = useState(false);

    const { data: folderContents, isLoading } = useQuery({
        queryKey: ['folderContents', currentFolderId],
        queryFn: () => fileService.getFolderContents(currentFolderId ?? 'root'),
    });

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
        setCurrentFolderId(folderId);
    };

    const navigateUp = () => {
        if (folderContents?.currentFolder?.parentId !== undefined) {
            setCurrentFolderId(folderContents.currentFolder.parentId);
        } else {
            setCurrentFolderId(null);
        }
    };

    const getFileIcon = (mimetype: string) => {
        if (mimetype.includes('pdf')) return '📄';
        if (mimetype.includes('image')) return '🖼️';
        if (mimetype.includes('audio')) return '🎵';
        if (mimetype.includes('video')) return '🎬';
        return '📎';
    };

    // Derived from API response
    const folders = folderContents?.folders || [];
    const files = folderContents?.files || [];
    const breadcrumbs = folderContents?.breadcrumbs || [];
    const currentFolderName = folderContents?.currentFolder?.name || 'Root';

    const toggleFileSelection = (fileId: number) => {
        setSelectedFileIds(prev =>
            prev.includes(fileId) ? prev.filter(id => id !== fileId) : [...prev, fileId]
        );
    };

    const toggleFolderSelection = (folderId: number) => {
        setSelectedFolderIds(prev =>
            prev.includes(folderId) ? prev.filter(id => id !== folderId) : [...prev, folderId]
        );
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

    const clearSelection = () => {
        setSelectedFileIds([]);
        setSelectedFolderIds([]);
    };

    return (
        <div className="space-y-6 container-app py-8">
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

                {breadcrumbs.map((crumb) => (
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

                {/* Always show current if not root and not in breadcrumbs (if logic differs) */}
                {/* Check if current is last breadcrumb, if not add it? API returns full path usually including current? */}
                {/* Based on my backend logic, I included current in breadcrumbs. So valid. */}
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
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center justify-between gap-2 overflow-hidden">
                            <div className="flex items-center gap-2 overflow-hidden">
                                <Folder className="h-5 w-5 fill-primary/20 text-primary shrink-0" />
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
                                    {folders.map((folder) => (
                                        <div
                                            key={folder.id}
                                            className={`flex items-center justify-between p-3 rounded-lg transition-colors group relative border ${selectedFolderIds.includes(folder.id) ? 'bg-primary/10 border-primary/20' : 'bg-muted/30 hover:bg-muted/50 border-transparent'
                                                }`}
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
                                                        <span className="font-medium text-base truncate">
                                                            {folder.name}
                                                        </span>
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
                                                            <DropdownMenuItem
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setManageAccessFolder(folder);
                                                                }}
                                                            >
                                                                <Shield className="mr-2 h-4 w-4" />
                                                                Berechtigungen
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setDeleteFolderId(folder.id);
                                                                }}
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
                                    {files.map((file) => (
                                        <div
                                            key={file.id}
                                            className={`flex items-center justify-between p-3 rounded-lg transition-colors border group relative ${selectedFileIds.includes(file.id)
                                                ? 'bg-primary/10 border-primary/30'
                                                : 'hover:bg-accent/50 border-transparent hover:border-border'
                                                } cursor-pointer`}
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
                                                    <span className="text-2xl flex-shrink-0">
                                                        {getFileIcon(file.mimetype)}
                                                    </span>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-medium truncate group-hover:text-primary transition-colors">{file.originalName}</p>
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
                                            <div className="flex items-center gap-1">
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
                                                        <DropdownMenuItem onClick={(e) => {
                                                            e.stopPropagation();
                                                            handlePreview(file.id);
                                                        }}>
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            Vorschau
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDownload(file.id, file.originalName);
                                                            }}
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
                                                                <DropdownMenuItem onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setManageAccessFile(file);
                                                                }}>
                                                                    <Shield className="mr-2 h-4 w-4" />
                                                                    Berechtigungen
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setDeleteFileId(file.id);
                                                                    }}
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
                                <Button
                                    size="sm"
                                    onClick={() => setIsBulkAccessOpen(true)}
                                    className="h-9"
                                >
                                    <Shield className="h-4 w-4 mr-2" />
                                    Berechtigungen setzen
                                </Button>

                                <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => {
                                        // Simple bulk delete confirmation or just open dialog? 
                                        // For simplicity, let's just use existing dialogs for single delete
                                        // Or we could implement bulk delete too.
                                        // Plan didn't specify bulk delete, but it's logical.
                                        // Let's stick to the plan: permissions.
                                    }}
                                    className="h-9 hidden sm:flex"
                                    disabled
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Löschen
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Upload Dialog */}
            <FileUploadDialog
                open={isUploadOpen}
                onOpenChange={setIsUploadOpen}
                currentFolderId={currentFolderId}
                currentFolderName={currentFolderName}
            />

            {/* Create Folder Dialog */}
            <CreateFolderDialog
                open={isCreateFolderOpen}
                onOpenChange={setIsCreateFolderOpen}
                currentFolderId={currentFolderId}
                currentFolderName={currentFolderName}
            />

            {/* Manage Access Dialog */}
            <ManageAccessDialog
                open={!!manageAccessFile}
                onOpenChange={(open) => !open && setManageAccessFile(null)}
                file={manageAccessFile}
            />

            {/* Manage Folder Access Dialog */}
            <ManageFolderAccessDialog
                open={!!manageAccessFolder}
                onOpenChange={(open) => !open && setManageAccessFolder(null)}
                folder={manageAccessFolder}
            />

            {/* Manage Bulk Access Dialog */}
            <ManageBulkAccessDialog
                open={isBulkAccessOpen}
                onOpenChange={setIsBulkAccessOpen}
                selectedFileIds={selectedFileIds}
                selectedFolderIds={selectedFolderIds}
            />

            {/* Delete File Confirmation Dialog */}
            <Dialog open={deleteFileId !== null} onOpenChange={() => setDeleteFileId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Datei löschen</DialogTitle>
                        <DialogDescription>
                            Möchten Sie diese Datei wirklich löschen? Diese Aktion kann nicht rückgängig
                            gemacht werden.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteFileId(null)}>
                            Abbrechen
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteFile}
                            disabled={deleteFileMutation.isPending}
                        >
                            {deleteFileMutation.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Löschen
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Folder Confirmation Dialog */}
            <Dialog open={deleteFolderId !== null} onOpenChange={() => setDeleteFolderId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Ordner löschen</DialogTitle>
                        <DialogDescription className="text-destructive font-medium">
                            WARNUNG: Möchten Sie den ausgewählten Ordner wirklich löschen?
                        </DialogDescription>
                        <DialogDescription>
                            Dies wird permanent <b>alle Dateien und Unterordner</b> darin löschen.
                            Diese Aktion kann nicht rückgängig gemacht werden.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteFolderId(null)}>
                            Abbrechen
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteFolder}
                            disabled={deleteFolderMutation.isPending}
                        >
                            {deleteFolderMutation.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Alles löschen
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* File Preview Dialog */}
            <FilePreviewDialog
                open={previewFileId !== null}
                onOpenChange={(open) => !open && setPreviewFileId(null)}
                files={files}
                initialFileId={previewFileId}
            />
        </div>
    );
}
