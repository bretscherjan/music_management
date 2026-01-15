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

import { useIsAdmin } from '@/context/AuthContext';
import { fileService } from '@/services/fileService';
import { formatFileSize } from '@/lib/utils';
import type { FileEntity } from '@/types';

import { FileUploadDialog } from '@/components/files/FileUploadDialog';
import { CreateFolderDialog } from '@/components/files/CreateFolderDialog';
import { ManageAccessDialog } from '@/components/files/ManageAccessDialog';

export function FileListPage() {
    const isAdmin = useIsAdmin();
    const queryClient = useQueryClient();
    const [currentFolder, setCurrentFolder] = useState('/');
    const [downloading, setDownloading] = useState<number | null>(null);
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
    const [manageAccessFile, setManageAccessFile] = useState<FileEntity | null>(null);
    const [deleteFileId, setDeleteFileId] = useState<number | null>(null);
    const [deleteFolderTarget, setDeleteFolderTarget] = useState<string | null>(null);

    const { data: files, isLoading } = useQuery({
        queryKey: ['files', currentFolder],
        queryFn: () => fileService.getAll({ folder: currentFolder }),
    });

    const { data: allFolders = [] } = useQuery({
        queryKey: ['folders'],
        queryFn: () => fileService.getFolders(),
    });

    const deleteFileMutation = useMutation({
        mutationFn: (id: number) => fileService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['files'] });
            queryClient.invalidateQueries({ queryKey: ['folders'] });
            setDeleteFileId(null);
        },
    });

    const deleteFolderMutation = useMutation({
        mutationFn: (folder: string) => fileService.deleteFolder(folder),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['files'] });
            queryClient.invalidateQueries({ queryKey: ['folders'] });
            setDeleteFolderTarget(null);
        },
    });

    const handleDownload = async (id: number, name: string) => {
        setDownloading(id);
        try {
            await fileService.downloadAndSave(id, name);
        } catch (error) {
            console.error('Download failed:', error);
        } finally {
            setDownloading(null);
        }
    };

    const handleDeleteFile = () => {
        if (deleteFileId) {
            deleteFileMutation.mutate(deleteFileId);
        }
    };

    const handleDeleteFolder = () => {
        if (deleteFolderTarget) {
            deleteFolderMutation.mutate(deleteFolderTarget);
        }
    };

    // Get subfolders logic
    const subfolders = Array.from(new Set(
        allFolders.map(path => {
            if (currentFolder === '/') {
                if (path === '/') return null;
                return '/' + path.split('/').filter(Boolean)[0];
            }
            if (path.startsWith(currentFolder + '/') && path !== currentFolder) {
                const suffix = path.slice(currentFolder.length);
                const nextSegment = suffix.split('/').filter(Boolean)[0];
                return currentFolder + '/' + nextSegment;
            }
            return null;
        }).filter(Boolean) as string[]
    )).sort();

    // Breadcrumbs
    const breadcrumbs = currentFolder === '/' ? [] : currentFolder.split('/').filter(Boolean);

    const navigateToFolder = (folder: string) => {
        setCurrentFolder(folder);
    };

    const navigateUp = (index: number) => {
        if (index === -1) {
            setCurrentFolder('/');
        } else {
            const parts = currentFolder.split('/').filter(Boolean);
            setCurrentFolder('/' + parts.slice(0, index + 1).join('/'));
        }
    };

    const getFileIcon = (mimetype: string) => {
        if (mimetype.includes('pdf')) return '📄';
        if (mimetype.includes('image')) return '🖼️';
        if (mimetype.includes('audio')) return '🎵';
        if (mimetype.includes('video')) return '🎬';
        return '📎';
    };

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
            <div className="flex items-center gap-2 text-sm">
                <button
                    onClick={() => navigateUp(-1)}
                    className="flex items-center gap-1 hover:text-primary transition-colors"
                >
                    <Home className="h-4 w-4" />
                    <span>Root</span>
                </button>
                {breadcrumbs.map((crumb, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        <button
                            onClick={() => navigateUp(index)}
                            className="hover:text-primary transition-colors"
                        >
                            {crumb}
                        </button>
                    </div>
                ))}
            </div>

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
                        <CardTitle className="text-lg">
                            {currentFolder === '/' ? 'Alle Dateien' : currentFolder}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {/* Subfolders */}
                            {subfolders.map((folder) => (
                                <div
                                    key={folder}
                                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                                    onClick={() => navigateToFolder(folder)}
                                >
                                    <div className="flex items-center gap-3">
                                        <Folder className="h-5 w-5 text-primary" />
                                        <span className="font-medium">
                                            {folder.split('/').filter(Boolean).pop()}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <ChevronRight className="h-4 w-4 text-muted-foreground mr-2" />
                                        {isAdmin && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDeleteFolderTarget(folder);
                                                }}
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {/* Files */}
                            {files?.map((file) => (
                                <div
                                    key={file.id}
                                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <span className="text-2xl flex-shrink-0">
                                            {getFileIcon(file.mimetype)}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-medium truncate">{file.originalName}</p>
                                            <div className="flex gap-2 text-xs text-muted-foreground">
                                                <span>{formatFileSize(file.size)}</span>
                                                {file.visibility !== 'all' && (
                                                    <Badge variant="outline" className="text-xs">
                                                        {file.visibility === 'admin' ? 'Admin' :
                                                            file.visibility === 'register' ? 'Register' :
                                                                'Begrenzt'}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Aktionen</DropdownMenuLabel>

                                                <DropdownMenuItem onClick={() => handleDownload(file.id, file.originalName)}>
                                                    {downloading === file.id ? (
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Download className="mr-2 h-4 w-4" />
                                                    )}
                                                    Herunterladen
                                                </DropdownMenuItem>

                                                {isAdmin && (
                                                    <>
                                                        <DropdownMenuSeparator />
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

                            {subfolders.length === 0 && files?.length === 0 && (
                                <div className="text-center text-muted-foreground py-8">
                                    Dieser Ordner ist leer
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Upload Dialog */}
            <FileUploadDialog
                open={isUploadOpen}
                onOpenChange={setIsUploadOpen}
                currentFolder={currentFolder}
            />

            {/* Create Folder Dialog */}
            <CreateFolderDialog
                open={isCreateFolderOpen}
                onOpenChange={setIsCreateFolderOpen}
                currentFolder={currentFolder}
            />

            {/* Manage Access Dialog */}
            <ManageAccessDialog
                open={!!manageAccessFile}
                onOpenChange={(open) => !open && setManageAccessFile(null)}
                file={manageAccessFile}
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
            <Dialog open={deleteFolderTarget !== null} onOpenChange={() => setDeleteFolderTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Ordner löschen</DialogTitle>
                        <DialogDescription className="text-destructive font-medium">
                            WARNUNG: Möchten Sie den Ordner "{deleteFolderTarget}" wirklich löschen?
                        </DialogDescription>
                        <DialogDescription>
                            Dies wird permanent <b>alle Dateien</b> in diesem Ordner und allen Unterordnern löschen.
                            Diese Aktion kann nicht rückgängig gemacht werden.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteFolderTarget(null)}>
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
        </div>
    );
}

export default FileListPage;
