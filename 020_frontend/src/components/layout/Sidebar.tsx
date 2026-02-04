import { Link, useLocation } from 'react-router-dom';
import { useAuth, useIsAdmin } from '@/context/AuthContext';
import {
    Calendar,
    Users,
    FileText,
    Home,
    Music,
    Newspaper,
    Library,
    BarChart,
    Folder,
    Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
    label: string;
    href: string;
    icon: React.ReactNode;
    adminOnly?: boolean;
}

const mainNavItems: NavItem[] = [
    { label: 'Dashboard', href: '/member', icon: <Home className="h-5 w-5" /> },
    { label: 'Termine', href: '/member/events', icon: <Calendar className="h-5 w-5" /> },
    { label: 'Dateien', href: '/member/files', icon: <FileText className="h-5 w-5" /> },
    { label: 'Mappen', href: '/member/music-folders', icon: <Folder className="h-5 w-5" /> },
    { label: 'Mitglieder', href: '/member/members', icon: <Users className="h-5 w-5" /> },
];

const adminNavItems: NavItem[] = [
    { label: 'Termine verwalten', href: '/member/admin/events', icon: <Calendar className="h-5 w-5" />, adminOnly: true },
    { label: 'Workspace', href: '/member/admin/workspace', icon: <Folder className="h-5 w-5" />, adminOnly: true },
    { label: 'Notenverwaltung', href: '/member/admin/sheet-music', icon: <Library className="h-5 w-5" />, adminOnly: true },
    { label: 'Register', href: '/member/admin/registers', icon: <Music className="h-5 w-5" />, adminOnly: true },
    { label: 'News', href: '/member/admin/news', icon: <Newspaper className="h-5 w-5" />, adminOnly: true },
    { label: 'Statistiken', href: '/member/admin/statistics', icon: <BarChart className="h-5 w-5" />, adminOnly: true },
];

export function Sidebar() {
    const { user } = useAuth();
    const isAdmin = useIsAdmin();
    const location = useLocation();

    return (
        <aside className="hidden md:flex flex-col w-64 bg-card border-r h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto">
            <div className="p-4 space-y-6">

                {/* Main Navigation */}
                <div className="space-y-1">
                    <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Allgemein
                    </h3>
                    <nav className="space-y-1">
                        {mainNavItems.map((item) => (
                            <Link
                                key={item.href}
                                to={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                    location.pathname === item.href
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                {item.icon}
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                </div>

                {/* Administration */}
                {isAdmin && (
                    <div className="space-y-1">
                        <div className="flex items-center px-3 mb-2 gap-2 text-muted-foreground">
                            <Shield className="h-3 w-3" />
                            <h3 className="text-xs font-semibold uppercase tracking-wider">
                                Verwaltung
                            </h3>
                        </div>
                        <nav className="space-y-1">
                            {adminNavItems.map((item) => (
                                <Link
                                    key={item.href}
                                    to={item.href}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                        location.pathname === item.href
                                            ? "bg-primary/10 text-primary"
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    )}
                                >
                                    {item.icon}
                                    {item.label}
                                </Link>
                            ))}
                        </nav>
                    </div>
                )}
            </div>

            <div className="mt-auto p-4 border-t">
                <div className="flex items-center gap-3 px-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </div>
                    <div className="flex flex-col overflow-hidden">
                        <span className="text-sm font-medium truncate">
                            {user?.firstName} {user?.lastName}
                        </span>
                        <span className="text-xs text-muted-foreground truncate">
                            {isAdmin ? 'Administrator' : 'Mitglied'}
                        </span>
                    </div>
                </div>
            </div>
        </aside>
    );
}

export default Sidebar;
