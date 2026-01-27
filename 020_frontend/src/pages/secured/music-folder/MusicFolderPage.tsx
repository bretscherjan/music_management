
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { Folder, Music, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { musicFolderService } from '@/services/musicFolderService';
import { useIsAdmin } from '@/context/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FolderContent } from './components/FolderContent';
import { toast } from 'sonner';

export const MusicFolderPage = () => {
    const { id } = useParams();
    const isAdmin = useIsAdmin();
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

    return (
        <div className="flex h-[calc(100vh-4rem)]">
            {/* Sidebar */}
            <div className="w-64 border-r bg-gray-50/50 p-4 flex flex-col gap-4">
                <div className="flex items-center justify-between">
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
                    <div className="flex flex-col gap-1 overflow-y-auto">
                        {folders?.map(folder => (
                            <Link
                                key={folder.id}
                                to={`/member/music-folders/${folder.id}`}
                                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${Number(id) === folder.id
                                    ? 'bg-blue-100 text-blue-900 font-medium'
                                    : 'hover:bg-gray-100 text-gray-700'
                                    }`}
                            >
                                <Folder className={`h-4 w-4 ${Number(id) === folder.id ? 'fill-blue-400' : 'text-gray-400'}`} />
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

            {/* Main Content */}
            <div className="flex-1 overflow-hidden">
                {id ? (
                    <FolderContent folderId={Number(id)} key={id} />
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-4">
                        <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center">
                            <Music className="h-8 w-8 text-gray-300" />
                        </div>
                        <p>Wähle eine Mappe aus um den Inhalt zu sehen</p>
                    </div>
                )}
            </div>
        </div>
    );
};
