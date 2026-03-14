import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { Folder, Music, Plus, Loader2, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { musicFolderService } from '@/services/musicFolderService';
import { useIsAdmin } from '@/context/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FolderContent } from './components/FolderContent';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

// --- Sub-Komponente außerhalb definieren, um Re-Mounting zu verhindern ---

interface FolderListProps {
    folders: any[] | undefined;
    isLoading: boolean;
    currentId: string | undefined;
    isAdmin: boolean;
    createOpen: boolean;
    setCreateOpen: (open: boolean) => void;
    newFolderName: string;
    setNewFolderName: (name: string) => void;
    handleCreateFolder: (e: React.FormEvent) => void;
    onItemClick?: () => void;
}

const FolderList = ({
    folders,
    isLoading,
    currentId,
    isAdmin,
    createOpen,
    setCreateOpen,
    newFolderName,
    setNewFolderName,
    handleCreateFolder,
    onItemClick
}: FolderListProps) => (
    <div className="flex flex-col gap-1 h-full">
        <div className="flex items-center justify-between mb-4 px-2">
            <h2 className="font-semibold text-lg flex items-center gap-2">
                <Folder className="h-5 w-5" />
                Mappen
            </h2>
            {isAdmin && (
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
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
        ) : (
            <div className="flex flex-col gap-1 overflow-y-auto flex-1">
                {folders?.map(folder => (
                    <Link
                        key={folder.id}
                        to={`/member/music-folders/${folder.id}`}
                        onClick={onItemClick}
                        className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                            Number(currentId) === folder.id
                                ? "bg-blue-100 text-blue-900 font-medium"
                                : "hover:bg-gray-100 text-gray-700"
                        )}
                    >
                        <Folder className={cn(
                            "h-4 w-4 flex-shrink-0",
                            Number(currentId) === folder.id ? "fill-blue-400" : "text-gray-400"
                        )} />
                        <span className="truncate">{folder.name}</span>
                        {folder._count?.items ? (
                            <span className="ml-auto text-xs text-gray-400">{folder._count.items}</span>
                        ) : null}
                    </Link>
                ))}
                {folders?.length === 0 && (
                    <div className="text-sm text-gray-400 text-center py-8">
                        Keine Mappen vorhanden
                    </div>
                )}
            </div>
        )}
    </div>
);

// --- Hauptseite ---

export const MusicFolderPage = () => {
    const { id } = useParams();
    const isAdmin = useIsAdmin();
    const [createOpen, setCreateOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
        folders,
        isLoading,
        currentId: id,
        isAdmin,
        createOpen,
        setCreateOpen,
        newFolderName,
        setNewFolderName,
        handleCreateFolder
    };

    return (
        <div className="flex flex-col md:flex-row h-[calc(100vh-8rem)] -my-4 md:-my-0 gap-4 md:gap-0 bg-background rounded-lg border shadow-sm overflow-hidden">
            {/* Mobile Header / Sidebar Toggle */}
            <div className="md:hidden border-b p-3 flex items-center gap-2 bg-muted/20">
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                            <Menu className="h-4 w-4" />
                            Mappen ({folders?.length || 0})
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[80vw] sm:w-[350px] p-4 pt-10">
                        <FolderList
                            {...commonProps}
                            onItemClick={() => setMobileMenuOpen(false)}
                        />
                    </SheetContent>
                </Sheet>
                {id && (
                    <span className="text-sm font-medium truncate ml-2">
                        {folders?.find(f => f.id === Number(id))?.name || 'Mappe'}
                    </span>
                )}
            </div>

            {/* Desktop Sidebar */}
            <div className="hidden md:flex w-64 border-r bg-muted/10 p-4 flex-col gap-4 overflow-hidden">
                <FolderList {...commonProps} />
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden flex flex-col min-w-0 bg-white">
                {id ? (
                    <FolderContent folderId={Number(id)} key={id} />
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-4 p-8 text-center">
                        <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center">
                            <Music className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                        <div>
                            <p className="font-medium">Keine Mappe ausgewählt</p>
                            <p className="text-sm mt-1">Wähle eine Mappe aus der Liste</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};