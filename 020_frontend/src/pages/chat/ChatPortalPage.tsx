import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import chatService from '@/services/chatService';
import socketService from '@/services/socketService';
import { userService } from '@/services/userService';
import { registerService } from '@/services/registerService';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, Plus, Search, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { useAuth, useCan } from '@/context/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

export function ChatPortalPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const can = useCan();
    const canCreateChat = can('chat:create');
    const canReadRegisters = can('registers:read');
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [isNewChatOpen, setIsNewChatOpen] = useState(false);
    const [userSearch, setUserSearch] = useState('');
    const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
    const [groupTitle, setGroupTitle] = useState('');

    const { data: chats, isLoading } = useQuery({
        queryKey: ['chats'],
        queryFn: () => chatService.getChats(),
        refetchInterval: 30000 
    });

    useEffect(() => {
        const unsubscribeUpdated = socketService.on('chat:updated', () => {
            queryClient.invalidateQueries({ queryKey: ['chats'] });
        });

        const unsubscribeDeleted = socketService.on('chat:deleted', () => {
            queryClient.invalidateQueries({ queryKey: ['chats'] });
        });

        return () => {
            unsubscribeUpdated();
            unsubscribeDeleted();
        };
    }, [queryClient]);

    const { data: usersData } = useQuery({
        queryKey: ['users'],
        queryFn: () => userService.getAll({ status: 'active' })
    });

    const { data: registers } = useQuery({
        queryKey: ['registers'],
        queryFn: () => registerService.getAll(),
        enabled: isNewChatOpen && canCreateChat && canReadRegisters,
    });

    const filteredUsers = usersData?.filter((u: any) => {
        if (u.id === user?.id) return false;
        if (!userSearch) return true;
        const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
        return fullName.includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase());
    });

    const handleCreateChat = async () => {
        try {
            if (selectedUserIds.length === 1) {
                const chat = await chatService.createDirectChat(selectedUserIds[0]);
                setIsNewChatOpen(false);
                navigate(`/member/chat/${chat.id}`);
            } else if (selectedUserIds.length > 1) {
                if (!groupTitle.trim()) {
                    alert('Bitte gib einen Gruppennamen ein');
                    return;
                }
                const chat = await chatService.createGroupChat(groupTitle.trim(), selectedUserIds);
                setIsNewChatOpen(false);
                navigate(`/member/chat/${chat.id}`);
            }
        } catch (error) {
            console.error('Failed to create chat:', error);
        }
    };

    const toggleUserSelection = (userId: number) => {
        setSelectedUserIds(prev => 
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };

    const selectAdmins = () => {
        const adminIds = usersData?.filter((u: any) => u.role === 'admin' && u.id !== user?.id).map((u: any) => u.id) || [];
        setSelectedUserIds(adminIds);
    };

    const selectRegister = (registerId: number) => {
        const memberIds = usersData?.filter((u: any) => u.registerId === registerId && u.id !== user?.id).map((u: any) => u.id) || [];
        setSelectedUserIds(memberIds);
    };

    const getChatTitle = (chat: any) => {
        if (chat.type === 'group') return chat.title || 'Gruppenchat';
        const otherParticipant = chat.participants.find((p: any) => p.userId !== user?.id);
        return otherParticipant ? `${otherParticipant.user.firstName} ${otherParticipant.user.lastName}` : 'Direct Chat';
    };

    const filteredChats = chats?.filter(chat =>
        getChatTitle(chat).toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleDeleteChat = async (e: React.MouseEvent, chatId: number) => {
        e.stopPropagation();
        if (!confirm('Chat wirklich löschen?')) return;
        try {
            await chatService.deleteChat(chatId);
            toast.success('Chat gelöscht');
            queryClient.invalidateQueries({ queryKey: ['chats'] });
        } catch (error) {
            toast.error('Fehler beim Löschen');
        }
    };

    return (
        <div className="space-y-5 max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <MessageSquare className="w-6 h-6 text-primary" />
                    Chats
                </h1>
                {canCreateChat && (
                    <Dialog open={isNewChatOpen} onOpenChange={(open) => {
                        setIsNewChatOpen(open);
                        if (!open) {
                            setSelectedUserIds([]);
                            setGroupTitle('');
                            setUserSearch('');
                        }
                    }}>
                        <DialogTrigger asChild>
                            <Button className="gap-2 h-10">
                                <Plus className="w-4 h-4" />
                                Neuer Chat
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                            <DialogHeader>
                                <DialogTitle>Neuen Chat starten</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4 flex-1 overflow-hidden flex flex-col">
                                {selectedUserIds.length > 1 && (
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Gruppenname</label>
                                        <Input
                                            placeholder="z.B. Trompeten-Team"
                                            value={groupTitle}
                                            onChange={(e) => setGroupTitle(e.target.value)}
                                        />
                                    </div>
                                )}

                                <div className="flex flex-wrap gap-2 pb-2">
                                    <Button size="sm" variant="outline" onClick={selectAdmins}>Nur Admins</Button>
                                    {canReadRegisters && registers?.map((reg: any) => (
                                        <Button key={reg.id} size="sm" variant="outline" onClick={() => selectRegister(reg.id)}>
                                            {reg.name}
                                        </Button>
                                    ))}
                                </div>

                                <div className="relative">
                                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Nach Mitgliedern suchen..."
                                        className="pl-10"
                                        value={userSearch}
                                        onChange={(e) => setUserSearch(e.target.value)}
                                    />
                                </div>

                                <div className="native-group divide-y divide-border/40 flex-1 overflow-y-auto">
                                    {filteredUsers?.map((u: any) => (
                                        <div
                                            key={u.id}
                                            className={cn(
                                                'flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors active:bg-muted/50',
                                                selectedUserIds.includes(u.id) ? 'bg-primary/5' : ''
                                            )}
                                            onClick={() => toggleUserSelection(u.id)}
                                        >
                                            <Avatar className="h-9 w-9 flex-shrink-0">
                                                <AvatarImage src={u.profilePicture} />
                                                <AvatarFallback name={`${u.firstName} ${u.lastName}`} />
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold">{u.firstName} {u.lastName}</p>
                                                <p className="text-xs text-muted-foreground">{u.register?.name || 'Mitglied'}</p>
                                            </div>
                                            <div className={cn(
                                                'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0',
                                                selectedUserIds.includes(u.id) ? 'bg-primary border-primary' : 'border-muted-foreground/30'
                                            )}>
                                                {selectedUserIds.includes(u.id) && <div className="w-2 h-2 bg-white rounded-full" />}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex justify-between items-center pt-4 border-t mt-auto">
                                <span className="text-sm text-muted-foreground">
                                    {selectedUserIds.length} ausgewählt
                                </span>
                                <div className="flex gap-2">
                                    <Button variant="ghost" onClick={() => setIsNewChatOpen(false)}>Abbrechen</Button>
                                    <Button
                                        onClick={handleCreateChat}
                                        disabled={selectedUserIds.length === 0 || (selectedUserIds.length > 1 && !groupTitle.trim())}
                                    >
                                        {selectedUserIds.length > 1 ? 'Gruppe erstellen' : 'Chat starten'}
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Chats durchsuchen..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Chat list */}
            {isLoading ? (
                <div className="native-group divide-y divide-border/40">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3 px-4 py-3.5 animate-pulse">
                            <div className="w-12 h-12 bg-muted rounded-full flex-shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-muted rounded w-1/3" />
                                <div className="h-3 bg-muted rounded w-2/3" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredChats?.length === 0 ? (
                <div className="native-group p-12 flex flex-col items-center gap-4 text-center">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <MessageSquare className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <p className="font-semibold text-base">Keine Chats gefunden</p>
                        <p className="text-sm text-muted-foreground mt-1">Starte eine neue Unterhaltung mit einem Mitglied.</p>
                    </div>
                    {canCreateChat && (
                        <Button onClick={() => setIsNewChatOpen(true)} className="gap-2 h-11 px-6">
                            <Plus className="w-4 h-4" />
                            Ersten Chat starten
                        </Button>
                    )}
                </div>
            ) : (
                <div className="native-group divide-y divide-border/40">
                    {filteredChats?.map((chat) => (
                        <div
                            key={chat.id}
                            className="flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors active:bg-muted/50 group relative"
                            onClick={() => navigate(`/member/chat/${chat.id}`)}
                        >
                            {/* Avatar with unread badge */}
                            <div className="relative flex-shrink-0">
                                <Avatar className="h-12 w-12">
                                    <AvatarImage src={chat.participants.find((p: any) => p.userId !== user?.id)?.user.profilePicture || undefined} />
                                    <AvatarFallback name={getChatTitle(chat)} />
                                </Avatar>
                                {chat.readStates[0]?.unreadCount > 0 && (
                                    <Badge
                                        className="absolute -top-0.5 -right-0.5 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
                                        variant="destructive"
                                    >
                                        {chat.readStates[0].unreadCount}
                                    </Badge>
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-0.5">
                                    <h3 className={cn(
                                        "font-semibold text-sm truncate pr-2",
                                        chat.readStates[0]?.unreadCount > 0 && "text-foreground"
                                    )}>
                                        {getChatTitle(chat)}
                                    </h3>
                                    {chat.lastMessageAt && (
                                        <span className="text-[11px] text-muted-foreground whitespace-nowrap flex-shrink-0">
                                            {formatDistanceToNow(new Date(chat.lastMessageAt), { addSuffix: false, locale: de })}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground truncate">
                                    {chat.lastMessagePreview || 'Noch keine Nachrichten'}
                                </p>
                            </div>

                            {/* Delete button — visible on desktop hover, always on touch */}
                            {canCreateChat && (chat.createdBy === user?.id || user?.role === 'admin') && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex-shrink-0"
                                    onClick={(e) => handleDeleteChat(e, chat.id)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
