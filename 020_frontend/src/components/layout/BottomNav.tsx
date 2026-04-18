import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { useAuth, useCan } from '@/context/AuthContext';
import { useUnread } from '@/context/UnreadContext';
import { cn } from '@/lib/utils';
import {
    Calendar, Folder, MessageSquare, FileText,
    MoreHorizontal, LogOut, Users, Download,
    Music, Newspaper, Library, BarChart,
    ClipboardList, Activity, ScrollText, Wrench,
    BookOpen, Database, TableProperties, Shield, BarChart2,
} from 'lucide-react';
import {
    Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

interface NavItem {
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    permission?: string;
    unreadKey?: 'chat' | 'events' | 'news' | 'polls';
}

const primaryTabs: NavItem[] = [
    { label: 'Termine', href: '/member/events', icon: Calendar, permission: 'events:read', unreadKey: 'events' },
    { label: 'Mappen', href: '/member/music-folders', icon: Folder, permission: 'folders:read' },
    { label: 'Chat', href: '/member/chat', icon: MessageSquare, permission: 'chat:read', unreadKey: 'chat' },
    { label: 'Dateien', href: '/member/files', icon: FileText, permission: 'files:read' },
];

const moreMainItems: NavItem[] = [
    { label: 'Mitglieder', href: '/member/members', icon: Users, permission: 'members:read' },
    { label: 'Abstimmungen', href: '/member/polls', icon: BarChart2, permission: 'polls:read', unreadKey: 'polls' },
];

const adminNavItems: NavItem[] = [
    { label: 'Toolkit', href: '/member/admin/toolkit', icon: Wrench, permission: 'toolkit:read' },
    { label: 'Theorie', href: '/member/admin/theory', icon: BookOpen, permission: 'theory:read' },
    { label: 'Grifftabelle', href: '/member/grifftabelle', icon: TableProperties, permission: 'grifftabelle:read' },
    { label: 'Termine verwalten', href: '/member/admin/events', icon: Calendar, permission: 'events:write' },
    { label: 'Workspace', href: '/member/admin/workspace', icon: Folder, permission: 'workspace:read' },
    { label: 'Notenverwaltung', href: '/member/admin/sheet-music', icon: Library, permission: 'sheetMusic:read' },
    { label: 'Register', href: '/member/admin/registers', icon: Music, permission: 'registers:write' },
    { label: 'News', href: '/member/admin/news', icon: Newspaper, permission: 'news:write', unreadKey: 'news' },
    { label: 'Statistiken', href: '/member/admin/statistics', icon: BarChart, permission: 'statistics:read' },
    { label: 'Engagement', href: '/member/admin/engagement', icon: Activity, permission: 'engagement:read' },
    { label: 'Protokoll', href: '/member/admin/protokoll', icon: ClipboardList, permission: 'protokoll:read' },
    { label: 'Logs', href: '/member/admin/logs', icon: ScrollText, permission: 'db:read' },
    { label: 'CMS', href: '/member/admin/cms', icon: Newspaper, permission: 'cms:write' },
    { label: 'DB', href: '/member/admin/db', icon: Database, permission: 'db:read' },
];

/** Small red dot indicator */
function UnreadDot({ className }: { className?: string }) {
    return (
        <span
            className={cn(
                'absolute w-2 h-2 rounded-full bg-primary ring-1 ring-background',
                className
            )}
            aria-hidden="true"
        />
    );
}

export function BottomNav() {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout } = useAuth();
    const can = useCan();
    const isAppMode = Capacitor.isNativePlatform();
    const [moreOpen, setMoreOpen] = useState(false);
    const { unreadCounts } = useUnread();

    const filteredPrimaryTabs = primaryTabs.filter(t => !t.permission || can(t.permission));

    const filteredMoreMainItems: NavItem[] = [
        ...moreMainItems.filter(t => !t.permission || can(t.permission)),
        ...(!isAppMode ? [{ label: 'Downloads', href: '/member/download', icon: Download }] : []),
    ];

    const filteredAdminItems = adminNavItems.filter(t => !t.permission || can(t.permission));
    const hasAdminItems = filteredAdminItems.length > 0;

    // Red dot on "Mehr" if any hidden item has unread
    const moreItemsHaveUnread = [
        ...filteredMoreMainItems,
        ...filteredAdminItems,
    ].some(item => item.unreadKey && (unreadCounts[item.unreadKey] ?? 0) > 0);

    const handleMoreNavClick = (href: string) => {
        setMoreOpen(false);
        navigate(href);
    };

    return (
        <>
            {/* Ghost spacer so page content never ends behind the fixed bottom nav */}
            <div className="md:hidden h-[calc(var(--nav-height)+env(safe-area-inset-bottom,0px))]" aria-hidden="true" />

            {/* Bottom Tab Bar */}
            <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-card/95 backdrop-blur-md border-t border-border pb-safe">
                <div className="flex items-stretch h-[var(--nav-height)]">
                    {filteredPrimaryTabs.slice(0, 4).map((tab) => {
                        const isActive = location.pathname.startsWith(tab.href);
                        const Icon = tab.icon;
                        const hasUnread = tab.unreadKey ? (unreadCounts[tab.unreadKey] ?? 0) > 0 : false;
                        return (
                            <Link
                                key={tab.href}
                                to={tab.href}
                                className={cn(
                                    'flex-1 flex flex-col items-center justify-center gap-1 transition-all active:scale-90 select-none',
                                    isActive ? 'text-primary' : 'text-muted-foreground'
                                )}
                            >
                                <div className={cn(
                                    'relative p-1 rounded-xl transition-colors',
                                    isActive && 'bg-primary/10'
                                )}>
                                    <Icon className="h-[1.15rem] w-[1.15rem]" />
                                    {hasUnread && <UnreadDot className="-top-0.5 -right-0.5" />}
                                </div>
                                <span className="text-[9px] font-semibold tracking-wide leading-none">{tab.label}</span>
                            </Link>
                        );
                    })}

                    {/* "Mehr" button */}
                    <button
                        onClick={() => setMoreOpen(true)}
                        className="flex-1 flex flex-col items-center justify-center gap-1 text-muted-foreground active:scale-90 transition-all select-none"
                    >
                        <div className="relative p-1 rounded-xl">
                            <MoreHorizontal className="h-[1.15rem] w-[1.15rem]" />
                            {moreItemsHaveUnread && <UnreadDot className="-top-0.5 -right-0.5" />}
                        </div>
                        <span className="text-[9px] font-semibold tracking-wide leading-none">Mehr</span>
                    </button>
                </div>
            </nav>

            {/* "Mehr" Sheet */}
            <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
                <SheetContent side="right" className="w-72 flex flex-col pb-safe">
                    <SheetHeader className="pb-2 border-b">
                        <SheetTitle>Navigation</SheetTitle>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto py-4 space-y-5">
                        {/* General items */}
                        {filteredMoreMainItems.length > 0 && (
                            <div className="space-y-0.5">
                                <h4 className="px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                                    Allgemein
                                </h4>
                                {filteredMoreMainItems.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = location.pathname === item.href;
                                    const hasUnread = item.unreadKey ? (unreadCounts[item.unreadKey] ?? 0) > 0 : false;
                                    return (
                                        <button
                                            key={item.href}
                                            onClick={() => handleMoreNavClick(item.href)}
                                            className={cn(
                                                'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors text-left',
                                                isActive
                                                    ? 'bg-primary/10 text-primary'
                                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                            )}
                                        >
                                            <div className="relative">
                                                <Icon className="h-5 w-5 flex-shrink-0" />
                                                {hasUnread && <UnreadDot className="-top-1 -right-0\.5" />}
                                            </div>
                                            {item.label}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Admin items */}
                        {hasAdminItems && (
                            <div className="space-y-0.5">
                                <div className="flex items-center gap-2 px-4 mb-1.5">
                                    <Shield className="h-3 w-3 text-muted-foreground" />
                                    <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                        Verwaltung
                                    </h4>
                                </div>
                                {filteredAdminItems.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = location.pathname === item.href;
                                    const hasUnread = item.unreadKey ? (unreadCounts[item.unreadKey] ?? 0) > 0 : false;
                                    return (
                                        <button
                                            key={item.href}
                                            onClick={() => handleMoreNavClick(item.href)}
                                            className={cn(
                                                'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors text-left',
                                                isActive
                                                    ? 'bg-primary/10 text-primary'
                                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                            )}
                                        >
                                            <div className="relative">
                                                <Icon className="h-5 w-5 flex-shrink-0" />
                                                {hasUnread && <UnreadDot className="-top-1 -right-0\.5" />}
                                            </div>
                                            {item.label}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="border-t pt-3">
                        <Button
                            variant="ghost"
                            className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive h-11 text-sm"
                            onClick={() => { setMoreOpen(false); logout(); }}
                        >
                            <LogOut className="h-5 w-5" />
                            Abmelden
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}
