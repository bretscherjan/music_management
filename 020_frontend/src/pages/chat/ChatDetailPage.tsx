import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import chatService from '@/services/chatService';
import socketService from '@/services/socketService';
import { userService } from '@/services/userService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
    ChevronLeft, Send, Users, Info, 
    Smile, Reply, Trash, UserPlus, X, Check, MessageSquare,
    Calendar, FileText, Folder as FolderIcon, User as UserIcon,
    Hash
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import type { Chat, ChatMessage, TypingEvent } from '@/types/chat';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface EntityLink {
    type: 'event' | 'file' | 'folder' | 'user';
    id: number;
    label: string;
}

const CATEGORIES = [
    { key: 'termin', label: 'Termine', type: 'event', icon: Calendar },
    { key: 'datei', label: 'Dateien', type: 'file', icon: FileText },
    { key: 'ordner', label: 'Ordner', type: 'folder', icon: FolderIcon },
    { key: 'benutzer', label: 'Mitglieder', type: 'user', icon: UserIcon },
];

export function ChatDetailPage() {
    const { chatId } = useParams<{ chatId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    
    const [newMessage, setNewMessage] = useState('');
    const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
    const [typingUsers, setTypingUsers] = useState<TypingEvent[]>([]);
    
    const [isInfoOpen, setIsInfoOpen] = useState(false);
    const [isAddUserOpen, setIsAddUserOpen] = useState(false);
    const [userSearch, setUserSearch] = useState('');
    
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    
    // Advanced Entity linking state
    const [showEntityPicker, setShowEntityPicker] = useState(false);
    const [activeCategory, setActiveCategory] = useState<typeof CATEGORIES[0] | null>(null);
    const [entitySearch, setEntitySearch] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const chatIdInt = parseInt(chatId!);

    const { data: chats } = useQuery({
        queryKey: ['chats'],
        queryFn: () => chatService.getChats()
    });

    const currentChat = chats?.find(c => c.id === chatIdInt);

    const { data: messages, isLoading } = useQuery({
        queryKey: ['messages', chatIdInt],
        queryFn: () => chatService.getMessages(chatIdInt),
        enabled: !!chatIdInt
    });

    const { data: allUsers } = useQuery({
        queryKey: ['users'],
        queryFn: () => userService.getAll({ status: 'active' }),
        enabled: isAddUserOpen
    });

    // Search results based on either general search or category-specific
    const { data: entityResults } = useQuery({
        queryKey: ['entitySearch', entitySearch, activeCategory?.type],
        queryFn: () => chatService.searchEntities(entitySearch, activeCategory?.type),
        enabled: showEntityPicker
    });

    const filteredCategories = CATEGORIES.filter(c => 
        !entitySearch || c.key.startsWith(entitySearch.toLowerCase())
    );

    const sendMessageMutation = useMutation({
        mutationFn: (data: { text: string, metadata?: any }) => 
            chatService.sendMessage(chatIdInt, data.text, 'text', data.metadata),
        onSuccess: () => {
            setNewMessage('');
            setReplyTo(null);
        },
        onError: () => toast.error('Nachricht konnte nicht gesendet werden')
    });

    const toggleReactionMutation = useMutation({
        mutationFn: (data: { messageId: string, emoji: string }) => 
            chatService.toggleReaction(chatIdInt, data.messageId, data.emoji)
    });

    useEffect(() => {
        if (!chatIdInt) return;

        socketService.joinChat(chatIdInt);
        chatService.markAsRead(chatIdInt);

        const unsubscribeMessage = socketService.on<ChatMessage>('chat:message:created', (msg) => {
            if (msg.chatId === chatIdInt) {
                queryClient.setQueryData(['messages', chatIdInt], (old: ChatMessage[] | undefined) => {
                    if (old?.find(m => m.id === msg.id)) return old;
                    return old ? [...old, msg] : [msg];
                });
                scrollToBottom();
                chatService.markAsRead(chatIdInt);
            }
        });

        const unsubscribeMessageUpdated = socketService.on<ChatMessage>('chat:message:updated', (msg) => {
            if (msg.chatId === chatIdInt) {
                queryClient.setQueryData(['messages', chatIdInt], (old: ChatMessage[] | undefined) => {
                    return old?.map(m => m.id === msg.id ? msg : m);
                });
            }
        });

        const unsubscribeTypingStarted = socketService.on<TypingEvent>('chat:typing:started', (data) => {
            if (data.chatId === chatIdInt) {
                setTypingUsers(prev => {
                    if (prev.find(u => u.userId === data.userId)) return prev;
                    return [...prev, data];
                });
            }
        });

        const unsubscribeTypingStopped = socketService.on<{ chatId: number, userId: number }>('chat:typing:stopped', (data) => {
            if (data.chatId === chatIdInt) {
                setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
            }
        });

        const unsubscribeChatUpdated = socketService.on<Chat>('chat:updated', (chat) => {
            if (chat.id === chatIdInt) {
                queryClient.invalidateQueries({ queryKey: ['chats'] });
            }
        });

        const unsubscribeChatDeleted = socketService.on<{ chatId: number }>('chat:deleted', (data) => {
            if (data.chatId === chatIdInt) {
                toast.info('Dieser Chat wurde gelöscht.');
                navigate('/member/chat');
            }
        });

        const unsubscribeParticipantRemoved = socketService.on<{ chatId: number, userId: number }>('chat:participant:removed', (data) => {
            if (data.chatId === chatIdInt) {
                if (data.userId === user?.id) {
                    toast.info('Du wurdest aus diesem Chat entfernt.');
                    navigate('/member/chat');
                } else {
                    queryClient.invalidateQueries({ queryKey: ['chats'] });
                }
            }
        });

        return () => {
            socketService.leaveChat(chatIdInt);
            unsubscribeMessage();
            unsubscribeMessageUpdated();
            unsubscribeTypingStarted();
            unsubscribeTypingStopped();
            unsubscribeChatUpdated();
            unsubscribeChatDeleted();
            unsubscribeParticipantRemoved();
        };
    }, [chatIdInt, queryClient, navigate, user?.id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || sendMessageMutation.isPending) return;
        
        const metadata: any = {};
        if (replyTo) {
            metadata.replyToId = replyTo.id;
            metadata.replyToText = replyTo.text;
        }

        sendMessageMutation.mutate({ text: newMessage.trim(), metadata });
        socketService.stopChatTyping(chatIdInt);
    };

    const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setNewMessage(val);
        socketService.startChatTyping(chatIdInt);

        // Advanced detection
        const lastHashIndex = val.lastIndexOf('#');
        if (lastHashIndex !== -1 && lastHashIndex >= val.length - 20) {
            const queryPart = val.substring(lastHashIndex + 1);
            
            // Check if user typed "termin " or similar
            const spaceIndex = queryPart.indexOf(' ');
            if (spaceIndex !== -1) {
                const categoryKey = queryPart.substring(0, spaceIndex).toLowerCase();
                const category = CATEGORIES.find(c => c.key === categoryKey);
                if (category) {
                    setActiveCategory(category);
                    setEntitySearch(queryPart.substring(spaceIndex + 1));
                    setShowEntityPicker(true);
                } else {
                    // Not a valid category after space, hide picker
                    setShowEntityPicker(false);
                    setActiveCategory(null);
                }
            } else {
                // Still typing category or general search
                setEntitySearch(queryPart);
                setShowEntityPicker(true);
                setActiveCategory(null);
            }
        } else {
            setShowEntityPicker(false);
            setActiveCategory(null);
        }

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            socketService.stopChatTyping(chatIdInt);
        }, 3000);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showEntityPicker) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            const max = activeCategory ? (entityResults?.length || 0) : filteredCategories.length;
            setSelectedIndex(prev => (prev + 1) % max);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const max = activeCategory ? (entityResults?.length || 0) : filteredCategories.length;
            setSelectedIndex(prev => (prev - 1 + max) % max);
        } else if (e.key === 'Enter' || e.key === 'Tab') {
            e.preventDefault();
            if (activeCategory) {
                if (entityResults?.[selectedIndex]) {
                    insertEntity(entityResults[selectedIndex]);
                }
            } else {
                if (filteredCategories[selectedIndex]) {
                    selectCategory(filteredCategories[selectedIndex]);
                }
            }
        } else if (e.key === 'Escape') {
            setShowEntityPicker(false);
        }
    };

    const selectCategory = (category: typeof CATEGORIES[0]) => {
        const lastHashIndex = newMessage.lastIndexOf('#');
        const beforeHash = newMessage.substring(0, lastHashIndex);
        setNewMessage(beforeHash + '#' + category.key + ' ');
        setActiveCategory(category);
        setEntitySearch('');
        setSelectedIndex(0);
        inputRef.current?.focus();
    };

    const insertEntity = (entity: any) => {
        const lastHashIndex = newMessage.lastIndexOf('#');
        const beforeHash = newMessage.substring(0, lastHashIndex);
        const entityTag = `[[${entity.type}:${entity.id}|${entity.label}]]`;
        setNewMessage(beforeHash + entityTag + ' ');
        setShowEntityPicker(false);
        setActiveCategory(null);
        inputRef.current?.focus();
    };

    const renderMessageText = (text: string) => {
        const parts = text.split(/(\[\[(?:event|file|folder|user):\d+\|[^\]]+\]\])/g);
        
        return parts.map((part, i) => {
            const match = part.match(/\[\[(event|file|folder|user):(\d+)\|([^\]]+)\]\]/);
            if (match) {
                const [, type, id, label] = match;
                let url = '';
                let Icon = UserIcon;

                switch (type) {
                    case 'event': 
                        url = `/member/events?id=${id}`; 
                        Icon = Calendar; 
                        break;
                    case 'file': 
                        url = `/member/files?fileId=${id}`; 
                        Icon = FileText; 
                        break;
                    case 'folder': 
                        url = `/member/files?folder=${id}`; 
                        Icon = FolderIcon; 
                        break;
                    case 'user': 
                        url = `/member/members?search=${encodeURIComponent(label)}`; 
                        Icon = UserIcon; 
                        break;
                }

                return (
                    <Link 
                        key={i} 
                        to={url} 
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors border border-primary/20 mx-0.5"
                    >
                        <Icon className="w-3 h-3" />
                        <span className="font-medium">{label}</span>
                    </Link>
                );
            }
            return part;
        });
    };

    const handleToggleReaction = (messageId: string, emoji: string) => {
        toggleReactionMutation.mutate({ messageId, emoji });
    };

    const handleUpdateTitle = async () => {
        try {
            await chatService.updateChat(chatIdInt, { title: newTitle });
            setIsEditingTitle(false);
            toast.success('Chat-Name aktualisiert');
        } catch (error) {
            toast.error('Fehler beim Aktualisieren des Namens');
        }
    };

    const handleDeleteChat = async () => {
        if (!confirm('Möchtest du diesen Chat wirklich löschen?')) return;
        try {
            await chatService.deleteChat(chatIdInt);
            navigate('/member/chat');
            toast.success('Chat gelöscht');
        } catch (error) {
            toast.error('Fehler beim Löschen des Chats');
        }
    };

    const handleAddUser = async (userId: number) => {
        try {
            await chatService.addParticipants(chatIdInt, [userId]);
            setIsAddUserOpen(false);
            toast.success('Mitglied hinzugefügt');
        } catch (error) {
            toast.error('Fehler beim Hinzufügen des Mitglieds');
        }
    };

    const handleRemoveUser = async (targetUserId: number) => {
        if (!confirm('Mitglied wirklich entfernen?')) return;
        try {
            await chatService.removeParticipant(chatIdInt, targetUserId);
            toast.success('Mitglied entfernt');
        } catch (error) {
            toast.error('Fehler beim Entfernen des Mitglieds');
        }
    };

    const getChatTitle = () => {
        if (!currentChat) return 'Chat';
        if (currentChat.type === 'group' && currentChat.title) return currentChat.title;
        if (currentChat.type === 'group') return 'Gruppenchat';
        const otherParticipant = currentChat.participants.find(p => p.userId !== user?.id);
        return otherParticipant ? `${otherParticipant.user.firstName} ${otherParticipant.user.lastName}` : 'Direct Chat';
    };

    const isOwner = currentChat?.createdBy === user?.id;
    const chatTitle = getChatTitle();

    if (!currentChat && !isLoading) return <div className="p-8 text-center">Chat nicht gefunden</div>;

    return (
        <div className="flex flex-col h-[calc(100vh-120px)] max-w-4xl mx-auto border rounded-lg overflow-hidden bg-background shadow-sm relative">
            {/* Entity Picker Popover */}
            {showEntityPicker && (
                <div 
                    className="absolute z-50 w-72 bg-card border rounded-lg shadow-xl p-2 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100 flex flex-col gap-1"
                    style={{ bottom: '80px', left: '20px' }}
                >
                    <div className="flex items-center justify-between px-2 py-1 border-b mb-1">
                        <span className="text-[10px] uppercase font-black text-primary flex items-center gap-1">
                            <Hash className="w-3 h-3" />
                            {activeCategory ? activeCategory.label : 'Verlinken...'}
                        </span>
                        {!activeCategory && <span className="text-[9px] text-muted-foreground">Tab zur Auswahl</span>}
                    </div>

                    {!activeCategory ? (
                        // Category Selection Stage
                        filteredCategories.map((cat, idx) => (
                            <div 
                                key={cat.key}
                                onClick={() => selectCategory(cat)}
                                className={cn(
                                    "flex items-center gap-3 p-2 rounded cursor-pointer transition-colors",
                                    selectedIndex === idx ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                                )}
                            >
                                <cat.icon className={cn("w-4 h-4", selectedIndex === idx ? "text-primary-foreground" : "text-primary")} />
                                <div className="flex-1">
                                    <p className="text-sm font-medium">{cat.label}</p>
                                    <p className={cn("text-[10px]", selectedIndex === idx ? "text-primary-foreground/70" : "text-muted-foreground")}>
                                        #{cat.key}
                                    </p>
                                </div>
                                {selectedIndex === idx && <Check className="w-3 h-3" />}
                            </div>
                        ))
                    ) : (
                        // Item Selection Stage
                        <>
                            {entityResults?.length === 0 ? (
                                <div className="text-xs text-muted-foreground p-4 text-center italic">Keine {activeCategory.label} gefunden</div>
                            ) : (
                                entityResults?.map((item: any, idx: number) => (
                                    <div 
                                        key={idx}
                                        onClick={() => insertEntity(item)}
                                        className={cn(
                                            "flex items-center gap-2 p-2 rounded cursor-pointer transition-colors",
                                            selectedIndex === idx ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                                        )}
                                    >
                                        <activeCategory.icon className={cn("w-3.5 h-3.5", selectedIndex === idx ? "text-primary-foreground" : "text-muted-foreground")} />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium truncate">{item.label}</p>
                                        </div>
                                        {selectedIndex === idx && <Check className="w-3 h-3" />}
                                    </div>
                                ))
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between bg-muted/30">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/member/chat')}>
                        <ChevronLeft className="w-6 h-6" />
                    </Button>
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarFallback>
                                {currentChat?.type === 'group' ? <Users /> : chatTitle.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h2 className="font-bold leading-none mb-1">{chatTitle}</h2>
                            {typingUsers.length > 0 ? (
                                <p className="text-xs text-primary animate-pulse">
                                    {typingUsers.length === 1 
                                        ? `${typingUsers[0].firstName} schreibt...` 
                                        : `${typingUsers.length} Personen schreiben...`}
                                </p>
                            ) : (
                                <p className="text-[10px] text-muted-foreground">
                                    {currentChat?.participants.length} Teilnehmer
                                </p>
                            )}
                        </div>
                    </div>
                </div>
                
                <div className="flex gap-1">
                    <Dialog open={isInfoOpen} onOpenChange={(open) => {
                        setIsInfoOpen(open);
                        if (open) setNewTitle(currentChat?.title || '');
                    }}>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Info className="w-5 h-5" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle>Chat Info</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-6 py-4">
                                {currentChat?.type === 'group' && (
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Gruppenname</label>
                                        <div className="flex gap-2">
                                            {isEditingTitle ? (
                                                <>
                                                    <Input 
                                                        value={newTitle} 
                                                        onChange={(e) => setNewTitle(e.target.value)}
                                                        autoFocus
                                                    />
                                                    <Button size="icon" onClick={handleUpdateTitle}><Check className="w-4 h-4" /></Button>
                                                    <Button size="icon" variant="ghost" onClick={() => setIsEditingTitle(false)}><X className="w-4 h-4" /></Button>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="flex-1 p-2 bg-muted rounded-md text-sm">{currentChat.title || 'Kein Name'}</div>
                                                    {isOwner && <Button variant="outline" size="sm" onClick={() => setIsEditingTitle(true)}>Ändern</Button>}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-medium">Teilnehmer</label>
                                        {currentChat?.type === 'group' && (
                                            <Button variant="ghost" size="sm" className="h-7 gap-1" onClick={() => setIsAddUserOpen(true)}>
                                                <UserPlus className="w-3 h-3" /> Hinzufügen
                                            </Button>
                                        )}
                                    </div>
                                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                        {currentChat?.participants.map(p => (
                                            <div key={p.id} className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={p.user.profilePicture || undefined} />
                                                        <AvatarFallback>{p.user.firstName[0]}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="text-sm font-medium">{p.user.firstName} {p.user.lastName}</p>
                                                        <p className="text-[10px] text-muted-foreground">{p.role}</p>
                                                    </div>
                                                </div>
                                                {currentChat.type === 'group' && isOwner && p.userId !== user?.id && (
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleRemoveUser(p.userId)}>
                                                        <Trash className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-4 border-t flex flex-col gap-2">
                                    {currentChat?.type === 'group' && (
                                        <Button variant="outline" className="text-destructive border-destructive hover:bg-destructive/10" onClick={() => handleRemoveUser(user!.id)}>
                                            Gruppe verlassen
                                        </Button>
                                    )}
                                    {isOwner && (
                                        <Button variant="destructive" onClick={handleDeleteChat}>
                                            Chat für alle löschen
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Mitglieder hinzufügen</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <Input 
                                    placeholder="Suchen..." 
                                    value={userSearch} 
                                    onChange={(e) => setUserSearch(e.target.value)} 
                                />
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {allUsers?.filter(u => 
                                        !currentChat?.participants.find(p => p.userId === u.id) &&
                                        `${u.firstName} ${u.lastName}`.toLowerCase().includes(userSearch.toLowerCase())
                                    ).map(u => (
                                        <div key={u.id} className="flex items-center justify-between p-2 hover:bg-muted rounded-md cursor-pointer" onClick={() => handleAddUser(u.id)}>
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={u.profilePicture || undefined} />
                                                    <AvatarFallback>{u.firstName[0]}</AvatarFallback>
                                                </Avatar>
                                                <span className="text-sm">{u.firstName} {u.lastName}</span>
                                            </div>
                                            <UserPlus className="w-4 h-4 text-primary" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/5">
                {isLoading ? (
                    <p className="text-center text-muted-foreground py-8">Lade Chat...</p>
                ) : messages?.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50 space-y-2">
                        <MessageSquare className="w-12 h-12" />
                        <p className="italic">Noch keine Nachrichten.</p>
                    </div>
                ) : (
                    messages?.map((msg, idx) => {
                        const isMine = msg.senderId === user?.id;
                        const participant = currentChat?.participants.find(p => p.userId === msg.senderId);
                        const sender = participant?.user;
                        const showAvatar = !isMine && (idx === 0 || messages[idx-1].senderId !== msg.senderId);

                        return (
                            <div key={msg.id} className={cn(
                                "flex items-end gap-2 group",
                                isMine ? "flex-row-reverse" : "flex-row"
                            )}>
                                {!isMine && (
                                    <div className="w-8">
                                        {showAvatar && (
                                            <Avatar className="w-8 h-8 shadow-sm">
                                                <AvatarImage src={sender?.profilePicture || undefined} />
                                                <AvatarFallback className="text-[10px]">{sender?.firstName[0]}</AvatarFallback>
                                            </Avatar>
                                        )}
                                    </div>
                                )}
                                <div className={cn(
                                    "max-w-[75%] space-y-1",
                                    isMine ? "items-end" : "items-start"
                                )}>
                                    {!isMine && showAvatar && currentChat?.type === 'group' && (
                                        <p className="text-[10px] text-muted-foreground ml-1 font-medium">{sender?.firstName}</p>
                                    )}

                                    {/* Reply Preview in Message Body */}
                                    {msg.replyToId && (
                                        <div className={cn(
                                            "text-[11px] p-2 rounded-t-lg border-l-4 bg-muted/50 mb-[-8px] opacity-80",
                                            isMine ? "border-primary-foreground/30 mr-1" : "border-primary ml-1"
                                        )}>
                                            <p className="truncate italic">"{msg.replyToText}"</p>
                                        </div>
                                    )}

                                    <div className="relative group/bubble">
                                        <div className={cn(
                                            "p-3 rounded-2xl shadow-sm transition-all relative",
                                            isMine 
                                                ? 'bg-primary text-primary-foreground rounded-br-none' 
                                                : 'bg-card border rounded-bl-none'
                                        )}>
                                            <div className="text-sm whitespace-pre-wrap break-words">{renderMessageText(msg.text)}</div>
                                            <p className={cn(
                                                "text-[9px] mt-1 text-right opacity-60",
                                            )}>
                                                {format(new Date(msg.createdAt), 'HH:mm')}
                                            </p>
                                        </div>

                                        {/* Reactions display */}
                                        {msg.reactions && msg.reactions.length > 0 && (
                                            <div className={cn(
                                                "flex flex-wrap gap-1 mt-1",
                                                isMine ? "justify-end" : "justify-start"
                                            )}>
                                                {msg.reactions.map((r: any) => (
                                                    <div 
                                                        key={r.emoji} 
                                                        onClick={() => handleToggleReaction(msg.id, r.emoji)}
                                                        className={cn(
                                                            "px-1.5 py-0.5 rounded-full text-[10px] border flex items-center gap-1 cursor-pointer hover:scale-105 transition-transform",
                                                            r.userIds.includes(user?.id) ? "bg-primary/10 border-primary/30" : "bg-muted"
                                                        )}
                                                    >
                                                        <span>{r.emoji}</span>
                                                        <span>{r.userIds.length}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Actions overlay */}
                                        <div className={cn(
                                            "absolute top-0 opacity-0 group-hover/bubble:opacity-100 transition-opacity flex gap-1 bg-background/80 backdrop-blur-sm p-1 rounded-full border shadow-sm z-10",
                                            isMine ? "right-full mr-2" : "left-full ml-2"
                                        )}>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => setReplyTo(msg)}>
                                                <Reply className="w-3.5 h-3.5" />
                                            </Button>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full">
                                                        <Smile className="w-3.5 h-3.5" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="center" className="min-w-0 p-1 flex gap-1">
                                                    {['👍', '❤️', '😂', '😮', '😢', '👏'].map(emoji => (
                                                        <DropdownMenuItem 
                                                            key={emoji} 
                                                            className="p-1.5 cursor-pointer hover:bg-muted"
                                                            onClick={() => handleToggleReaction(msg.id, emoji)}
                                                        >
                                                            {emoji}
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Reply Preview Above Composer */}
            {replyTo && (
                <div className="px-4 py-2 border-t bg-muted/20 flex items-center justify-between animate-in slide-in-from-bottom-2 duration-200">
                    <div className="flex items-center gap-3 border-l-4 border-primary pl-3 py-1">
                        <Reply className="w-4 h-4 text-primary" />
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold text-primary">Antwort auf</p>
                            <p className="text-xs truncate text-muted-foreground">{replyTo.text}</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setReplyTo(null)}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            )}

            {/* Composer */}
            <form onSubmit={handleSend} className="p-4 border-t bg-muted/30 flex gap-2">
                <Input
                    ref={inputRef}
                    placeholder="Deine Nachricht... (# für Links)"
                    value={newMessage}
                    onChange={handleTyping}
                    onKeyDown={handleKeyDown}
                    className="flex-1 focus-visible:ring-primary"
                />
                <Button type="submit" size="icon" disabled={!newMessage.trim() || sendMessageMutation.isPending} className="shrink-0">
                    <Send className="w-4 h-4" />
                </Button>
            </form>
        </div>
    );
}
