import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Folder, Music, Plus, Loader2, ChevronRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { musicFolderService } from '@/services/musicFolderService';
import { useCan } from '@/context/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FolderContent } from './components/FolderContent';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/common/PageHeader';

// ── Desktop sidebar folder list ────────────────────────────────────────────────

interface FolderListProps {
    folders: any[] | undefined;
    isLoading: boolean;
    currentId: string | undefined;
    canManageFolders: boolean;
    createOpen: boolean;
    setCreateOpen: (open: boolean) => void;
    newFolderName: string;
    setNewFolderName: (name: string) => void;
    handleCreateFolder: (e: React.FormEvent) => void;
    onItemClick?: () => void;
}

const FolderList = ({
    folders, isLoading, currentId, canManageFolders,
    createOpen, setCreateOpen, newFolderName, setNewFolderName,
    handleCreateFolder, onItemClick
}: FolderListProps) => (
    <div className="flex flex-col gap-1 h-full">
        <div className="flex items-center justify-between mb-4 px-2">
            <h2 className="font-semibold text-base flex items-center gap-2">
                <Folder className="h-4 w-4 text-primary" />
                Mappen
            </h2>
            {canManageFolders && (
                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-8 w-8">
                            <Plus className="h-4 w-4" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Neue Mappe erstellen</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreateFolder} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Name</Label>
                                <Input
                                    value={newFolderName}
                                    onChange={(e) => setNewFolderName(e.target.value)}
                                    placeholder="z.B. Frühlingskonzert 2026"
                                    required
                                    autoFocus
                                />
                            </div>
                            <Button type="submit" className="w-full">Erstellen</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            )}
        </div>
        {isLoading ? (
            <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
        ) : (
            <div className="flex flex-col gap-0.5 overflow-y-auto flex-1">
                {folders?.map(folder => (
                    <Link
                        key={folder.id}
                        to={`/member/music-folders/${folder.id}`}
                        onClick={onItemClick}
                        className={cn(
                            "flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors",
                            Number(currentId) === folder.id
                                ? "bg-primary/10 text-primary font-semibold"
                                : "hover:bg-muted text-foreground"
                        )}
                    >
                        <Folder className={cn(
                            "h-4 w-4 flex-shrink-0",
                            Number(currentId) === folder.id ? "text-primary" : "text-muted-foreground"
                        )} />
                        <span className="truncate flex-1">{folder.name}</span>
                        {folder._count?.items ? (
                            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                                {folder._count.items}
                            </span>
                        ) : null}
                    </Link>
                ))}
                {folders?.length === 0 && (
                    <div className="text-sm text-muted-foreground text-center py-8">
                        Keine Mappen vorhanden
                    </div>
                )}
            </div>
        )}
    </div>
);

// ── Main page ──────────────────────────────────────────────────────────────────

export const MusicFolderPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const can = useCan();
    const canManageFolders = can('folders:write');
    const [createOpen, setCreateOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');

    const { data: folders, isLoading, refetch } = useQuery({
        queryKey: ['musicFolders'],
        queryFn: musicFolderService.getAll
    });

    const handleCreateFolder = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await musicFolderService.create({ name: newFolderName });
            toast.success('Mappe erstellt');
            setCreateOpen(false);
            setNewFolderName('');
            refetch();
        } catch (error) {
            toast.error('Fehler beim Erstellen');
        }
    };

    const commonProps = {
        folders, isLoading, currentId: id, canManageFolders,
        createOpen, setCreateOpen, newFolderName, setNewFolderName, handleCreateFolder
    };

    return (
        <div className="space-y-5">
            <PageHeader
                title="Mappen"
                subtitle="Notenmappen durchsuchen und verwalten"
                Icon={Folder}
            />

            <div className="flex flex-col md:flex-row h-[calc(100vh-8rem)] -my-4 md:-my-0 gap-4 md:gap-0 bg-background rounded-2xl overflow-hidden">

                {/* ── Mobile: Drill-down list (shown when no folder selected) ── */}
                <div className={cn("md:hidden flex flex-col flex-1 overflow-hidden", id && "hidden")}>
                    {/* Mobile folder list header */}
                    <div className="flex items-center justify-between px-4 py-4 border-b">
                        <p className="text-sm font-semibold text-muted-foreground">Alle Mappen</p>
                        {canManageFolders && (
                            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                                <DialogTrigger asChild>
                                    <Button className="h-11 w-11 rounded-2xl shadow-sm p-0">
                                        <Plus className="h-5 w-5" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Neue Mappe erstellen</DialogTitle>
                                    </DialogHeader>
                                    <form onSubmit={handleCreateFolder} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Name</Label>
                                            <Input
                                                value={newFolderName}
                                                onChange={(e) => setNewFolderName(e.target.value)}
                                                placeholder="z.B. Frühlingskonzert 2026"
                                                required
                                                autoFocus
                                            />
                                        </div>
                                        <Button type="submit" className="w-full h-11">Erstellen</Button>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>
                {/* Mobile folder drill-down list */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {isLoading ? (
                            <div className="native-group divide-y divide-border/40">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="flex items-center gap-3 px-4 py-4">
                                        <div className="h-10 w-10 rounded-xl bg-muted flex-shrink-0" />
                                        <div className="flex-1 space-y-1.5">
                                            <div className="h-4 bg-muted rounded w-32" />
                                            <div className="h-3 bg-muted rounded w-20" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : folders?.length === 0 ? (
                            /* Empty state */
                            <div className="flex flex-col items-center justify-center h-full gap-4 py-20 text-center">
                                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Music className="h-10 w-10 text-primary" />
                                </div>
                                <div>
                                    <p className="font-semibold text-base">Noch keine Mappen</p>
                                    <p className="text-sm text-muted-foreground mt-1">Erstelle deine erste Notenmappe</p>
                                </div>
                                {canManageFolders && (
                                    <Button className="gap-2 h-11 px-6" onClick={() => setCreateOpen(true)}>
                                        <Plus className="h-4 w-4" />
                                        Neue Mappe
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {folders?.map(folder => (
                                    <Link
                                        key={folder.id}
                                        to={`/member/music-folders/${folder.id}`}
                                        className="flex items-center gap-4 p-5 bg-card rounded-3xl shadow-sm transition-all active:scale-[0.98] active:shadow-none border border-border/50"
                                    >
                                        {/* Left: folder icon pill */}
                                        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                            <Folder className="h-6 w-6 text-primary" />
                                        </div>
                                        {/* Center */}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-base">{folder.name}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {folder._count?.items
                                                    ? `${folder._count.items} Stück${folder._count.items !== 1 ? 'e' : ''}`
                                                    : 'Leer'}
                                            </p>
                                        </div>
                                        {/* Right: chevron */}
                                        <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Mobile: Folder content with back navigation ── */}
                <div className={cn("md:hidden flex flex-col flex-1 overflow-hidden bg-background", !id && "hidden")}>
                    {/* Sticky mobile back header */}
                    <div className="flex items-center gap-2 px-3 py-2 border-b bg-card sticky top-0 z-10">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 -ml-1 text-primary font-medium"
                            onClick={() => navigate('/member/music-folders')}
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Mappen
                        </Button>
                        <span className="text-sm font-semibold truncate flex-1 text-center pr-8">
                            {folders?.find(f => f.id === Number(id))?.name || ''}
                        </span>
                    </div>
                    {id && <FolderContent folderId={Number(id)} key={id} />}
                </div>

                {/* ── Desktop: sidebar + main ── */}
                <div className="hidden md:flex w-64 border-r bg-muted/10 p-4 flex-col gap-4 overflow-hidden">
                    <FolderList {...commonProps} />
                </div>

                <div className="hidden md:flex flex-1 overflow-hidden flex-col min-w-0 bg-card">
                    {id ? (
                        <FolderContent folderId={Number(id)} key={id} />
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-4 p-8 text-center">
                            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                                <Music className="h-10 w-10 text-primary" />
                            </div>
                            <div>
                                <p className="font-semibold text-base text-foreground">Keine Mappe ausgewählt</p>
                                <p className="text-sm mt-1">Wähle eine Mappe aus der linken Seitenleiste</p>
                            </div>
                            {canManageFolders && folders?.length === 0 && (
                                <Button className="gap-2 h-11 px-6" onClick={() => setCreateOpen(true)}>
                                    <Plus className="h-4 w-4" />
                                    Erste Mappe erstellen
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
