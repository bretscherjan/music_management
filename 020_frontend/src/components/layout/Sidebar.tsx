import { Link, useLocation } from 'react-router-dom';
import { useAuth, useIsAdmin, useCan } from '@/context/AuthContext';
import {
    Calendar,
    Users,
    FileText,
    Music,
    Newspaper,
    Library,
    BarChart,
    Folder,
    ClipboardList,
    Activity,
    ScrollText,
    Wrench,
    BookOpen,
    Database,
    TableProperties,
    MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
    label: string;
    href: string;
    icon: React.ReactNode;
    adminOnly?: boolean;
    permission?: string;
}

const mainNavItems: NavItem[] = [
    { label: 'Termine', href: '/member/events', icon: <Calendar className="h-5 w-5" />, permission: 'calendar:read' },
    { label: 'Dateien', href: '/member/files', icon: <FileText className="h-5 w-5" />, permission: 'files:read' },
    { label: 'Mappen', href: '/member/music-folders', icon: <Folder className="h-5 w-5" />, permission: 'sheetMusic:read' },
    { label: 'Mitglieder', href: '/member/members', icon: <Users className="h-5 w-5" /> }, // Public list for members
    { label: 'Chat', href: '/member/chat', icon: <MessageSquare className="h-5 w-5" />, permission: 'chat:read' },
];

const adminNavItems: NavItem[] = [
    { label: 'Toolkit', href: '/member/admin/toolkit', icon: <Wrench className="h-5 w-5" />, adminOnly: true },
    { label: 'Theorie', href: '/member/admin/theory', icon: <BookOpen className="h-5 w-5" />, adminOnly: true },
    { label: 'Grifftabelle', href: '/member/grifftabelle', icon: <TableProperties className="h-5 w-5" />, adminOnly: true },
    { label: 'Termine verwalten', href: '/member/admin/events', icon: <Calendar className="h-5 w-5" />, adminOnly: true, permission: 'calendar:write' },
    { label: 'Workspace', href: '/member/admin/workspace', icon: <Folder className="h-5 w-5" />, adminOnly: true, permission: 'workspace:read' },
    { label: 'Notenverwaltung', href: '/member/admin/sheet-music', icon: <Library className="h-5 w-5" />, adminOnly: true, permission: 'sheetMusic:write' },
    { label: 'Register', href: '/member/admin/registers', icon: <Music className="h-5 w-5" />, adminOnly: true },
    { label: 'News', href: '/member/admin/news', icon: <Newspaper className="h-5 w-5" />, adminOnly: true, permission: 'cms:write' },
    { label: 'Statistiken', href: '/member/admin/statistics', icon: <BarChart className="h-5 w-5" />, adminOnly: true },
    { label: 'Engagement', href: '/member/admin/engagement', icon: <Activity className="h-5 w-5" />, adminOnly: true },
    { label: 'Protokoll', href: '/member/admin/protokoll', icon: <ClipboardList className="h-5 w-5" />, adminOnly: true },
    { label: 'Logs', href: '/member/admin/logs', icon: <ScrollText className="h-5 w-5" />, adminOnly: true },
    { label: 'CMS', href: '/member/admin/cms', icon: <Newspaper className="h-5 w-5" />, adminOnly: true, permission: 'cms:write' },
    { label: 'DB', href: '/member/admin/db', icon: <Database className="h-5 w-5" />, adminOnly: true },
];

export function Sidebar() {
    const { user } = useAuth();
    const isAdmin = useIsAdmin();
    const can = useCan();
    const location = useLocation();

    const filteredMainNavItems = mainNavItems.filter(item => 
        !item.permission || can(item.permission)
    );

    const filteredAdminNavItems = adminNavItems.filter(item => 
        (!item.permission || can(item.permission)) && (isAdmin || !item.adminOnly)
    );

    const showAdminNav = isAdmin || filteredAdminNavItems.length > 0;

    return (
        <aside className="hidden md:flex flex-col w-[100px] bg-card border-r border-border h-[calc(100vh-4rem)] sticky top-16 shrink-0 z-30">

            {/* Profile Section (Top) */}
            <Link
                to="/member/settings"
                className="pt-4 pb-2 flex flex-col items-center justify-center border-b border-border/50 mx-4 mb-2 hover:bg-muted/50 transition-colors rounded-b-lg"
            >
                <div className="h-9 w-9 rounded-full bg-brand-red/10 flex items-center justify-center text-brand-red font-bold text-sm shadow-sm mb-1 group-hover:scale-110 transition-transform">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
                <span className="text-[10px] text-muted-foreground font-bold truncate max-w-full">
                    Einstellungen
                </span>
            </Link>

            <div className="px-2 py-1 flex-1 flex flex-col gap-1 overflow-hidden hover:overflow-y-auto custom-scrollbar">

                {/* Main Navigation */}
                <nav className="flex flex-col gap-1">
                    {filteredMainNavItems.map((item) => {
                        const isActive = location.pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                to={item.href}
                                className={cn(
                                    "flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all duration-200 group",
                                    isActive
                                        ? "bg-brand-red/10 text-brand-red shadow-sm brand-glow"
                                        : "text-muted-foreground hover:text-brand-red hover:bg-brand-red/5"
                                )}
                            >
                                <div className={cn(
                                    "p-0.5 rounded-full transition-colors",
                                )}>
                                    <div className="!h-5 !w-5 [&>svg]:h-5 [&>svg]:w-5">
                                        {item.icon}
                                    </div>
                                </div>
                                <span className="text-[10px] font-medium tracking-wide text-center leading-none">
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Separator */}
                {showAdminNav && (
                    <div className="mx-4 my-1 border-t border-border/50" />
                )}

                {/* Administration */}
                {showAdminNav && (
                    <nav className="flex flex-col gap-1">
                        {filteredAdminNavItems.map((item) => {
                            const isActive = location.pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    to={item.href}
                                    className={cn(
                                        "flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all duration-200 group",
                                        isActive
                                            ? "bg-primary/10 text-primary shadow-sm"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                    )}
                                >
                                    <div className="!h-5 !w-5 [&>svg]:h-5 [&>svg]:w-5">
                                        {item.icon}
                                    </div>
                                    <span className="text-[10px] font-medium tracking-wide text-center leading-none">
                                        {item.label}
                                    </span>
                                </Link>
                            );
                        })}
                    </nav>
                )}
            </div>

            {/* Bottom spacer if needed, or remove completely */}
        </aside>
    );
}
