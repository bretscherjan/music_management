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
    CornerUpLeft
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
import { ManageFolderAccessDialog } from '@/components/files/ManageFolderAccessDialog';

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
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Folder className="h-5 w-5 fill-primary/20 text-primary" />
                            {currentFolderName}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {/* Subfolders */}
                            {folders.map((folder) => (
                                <div
                                    key={folder.id}
                                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
                                >
                                    <div
                                        className="flex items-center gap-3 flex-1 cursor-pointer"
                                        onClick={() => navigateToFolder(folder.id)}
                                    >
                                        <Folder className="h-10 w-10 fill-primary/20 text-primary transition-transform group-hover:scale-110" />
                                        <div className="flex flex-col">
                                            <span className="font-medium text-base">
                                                {folder.name}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {(folder._count?.files || 0) + (folder._count?.children || 0)} Objekte
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <ChevronRight className="h-4 w-4 text-muted-foreground mr-2" />
                                        {isAdmin && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover: opacity-100 transition-opacity">
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

                            {/* Files */}
                            {files.map((file) => (
                                <div
                                    key={file.id}
                                    className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors border border-transparent hover:border-border"
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
                                                    <Badge variant="outline" className="text-xs ml-2">
                                                        {file.visibility === 'admin' ? 'Admin' :
                                                            file.visibility === 'register' ? 'Register' :
                                                                'Begrenzt'}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDownload(file.id, file.originalName)}
                                        >
                                            {downloading === file.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Download className="h-4 w-4" />
                                            )}
                                        </Button>

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
                                                    <Download className="mr-2 h-4 w-4" />
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

                            {folders.length === 0 && files.length === 0 && (
                                <div className="text-center text-muted-foreground py-12 flex flex-col items-center">
                                    <div className="bg-muted rounded-full p-4 mb-3">
                                        <Folder className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                    <p>Dieser Ordner ist leer</p>
                                    {isAdmin && currentFolderId !== null && (
                                        <Button variant="link" onClick={() => setIsUploadOpen(true)}>
                                            Erste Datei hochladen
                                        </Button>
                                    )}
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
        </div>
    );
}
