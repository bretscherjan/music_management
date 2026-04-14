import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { useAuth, useCan } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
    Calendar,
    Download,
    Users,
    FileText,
    LogOut,
    Menu,
    X,
    Music,
    Newspaper,
    Settings,
    Library,
    BarChart,
    Folder,
    Shield,
    ClipboardList,
    Activity,
    Database,
    Wrench,
    BookOpen,
    TableProperties,
    MessageSquare,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';


interface NavItem {
    label: string;
    href: string;
    icon: React.ReactNode;
    permission?: string;
}

const mainNavItems: NavItem[] = [
    { label: 'Termine', href: '/member/events', icon: <Calendar className="h-5 w-5" />, permission: 'events:read' },
    { label: 'Dateien', href: '/member/files', icon: <FileText className="h-5 w-5" />, permission: 'files:read' },
    { label: 'Mappen', href: '/member/music-folders', icon: <Folder className="h-5 w-5" />, permission: 'folders:read' },
    { label: 'Mitglieder', href: '/member/members', icon: <Users className="h-5 w-5" />, permission: 'members:read' },
    { label: 'Chat', href: '/member/chat', icon: <MessageSquare className="h-5 w-5" />, permission: 'chat:read' },
];

const adminNavItems: NavItem[] = [
    { label: 'Toolkit', href: '/member/admin/toolkit', icon: <Wrench className="h-5 w-5" />, permission: 'toolkit:read' },
    { label: 'Theorie', href: '/member/admin/theory', icon: <BookOpen className="h-5 w-5" />, permission: 'theory:read' },
    { label: 'Grifftabelle', href: '/member/grifftabelle', icon: <TableProperties className="h-5 w-5" />, permission: 'grifftabelle:read' },
    { label: 'Termine admin', href: '/member/admin/events', icon: <Calendar className="h-5 w-5" />, permission: 'events:write' },
    { label: 'Workspace', href: '/member/admin/workspace', icon: <Folder className="h-5 w-5" />, permission: 'workspace:read' },
    { label: 'Noten', href: '/member/admin/sheet-music', icon: <Library className="h-5 w-5" />, permission: 'sheetMusic:read' },
    { label: 'Register', href: '/member/admin/registers', icon: <Music className="h-5 w-5" />, permission: 'registers:write' },
    { label: 'News', href: '/member/admin/news', icon: <Newspaper className="h-5 w-5" />, permission: 'news:write' },
    { label: 'Statistiken', href: '/member/admin/statistics', icon: <BarChart className="h-5 w-5" />, permission: 'statistics:read' },
    { label: 'Engagement', href: '/member/admin/engagement', icon: <Activity className="h-5 w-5" />, permission: 'engagement:read' },
    { label: 'Protokoll', href: '/member/admin/protokoll', icon: <ClipboardList className="h-5 w-5" />, permission: 'protokoll:read' },
    { label: 'DB', href: '/member/admin/db', icon: <Database className="h-5 w-5" />, permission: 'db:read' },
    { label: 'CMS', href: '/member/admin/cms', icon: <Newspaper className="h-5 w-5" />, permission: 'cms:write' },
];

export function Header() {
    const { logout } = useAuth();
    const can = useCan();
    const location = useLocation();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const isAppMode = Capacitor.isNativePlatform();
    const downloadNavItem: NavItem = { label: 'Downloads', href: '/member/download', icon: <Download className="h-5 w-5" /> };
    const memberNavItems: NavItem[] = isAppMode
        ? mainNavItems
        : [...mainNavItems, downloadNavItem];
    const filteredMainNavItems = memberNavItems.filter((item) => !item.permission || can(item.permission));
    const filteredAdminNavItems = adminNavItems.filter((item) => !item.permission || can(item.permission));

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
            <div className="container-app flex h-16 items-center justify-between">
                {/* Logo & Mobile Menu Trigger (Left align on mobile?) No, standart right aligned hamburger usually. */}
                <Link to="/member" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <img src={'/logos/logo_smile.svg'} alt="Musig Elgg Logo" className="h-8 w-8 rounded-full object-cover" />
                    <div className="flex flex-col">
                        <span className="font-bold text-lg leading-tight">Musig Elgg</span>
                        <span className="text-xs text-muted-foreground">Mitgliederbereich</span>
                    </div>
                </Link>

                {/* Right Side Actions */}
                <div className="flex items-center gap-2 md:gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate('/member/settings')}
                        title="Einstellungen"
                    >
                        <Settings className="h-5 w-5" />
                    </Button>

                    <Button variant="ghost" size="icon" onClick={logout} title="Abmelden" className="hidden md:inline-flex">
                        <LogOut className="h-5 w-5" />
                    </Button>

                    {/* Mobile Menu Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </Button>
                </div>
            </div>

            {/* Mobile Navigation Overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 top-16 z-40 bg-background/95 backdrop-blur-sm md:hidden animate-in slide-in-from-top-5 fade-in-0"
                    style={{ height: 'calc(100vh - 4rem)' }}
                >
                    <nav className="h-full overflow-y-auto p-4 space-y-6 pb-20">
                        <div className="space-y-1">
                            <h4 className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                Allgemein
                            </h4>
                            {filteredMainNavItems.map((item) => (
                                <Link
                                    key={item.href}
                                    to={item.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-3 rounded-md text-base font-medium transition-colors active:bg-muted",
                                        location.pathname === item.href
                                            ? "bg-primary/10 text-primary"
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    )}
                                >
                                    {item.icon}
                                    {item.label}
                                </Link>
                            ))}
                        </div>

                        {filteredAdminNavItems.length > 0 && (
                            <div className="space-y-1">
                                <div className="flex items-center px-4 mb-2 gap-2 text-muted-foreground">
                                    <Shield className="h-3 w-3" />
                                    <h4 className="text-xs font-semibold uppercase tracking-wider">
                                        Verwaltung
                                    </h4>
                                </div>
                                {filteredAdminNavItems.map((item) => (
                                    <Link
                                        key={item.href}
                                        to={item.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={cn(
                                            "flex items-center gap-3 px-4 py-3 rounded-md text-base font-medium transition-colors active:bg-muted",
                                            location.pathname === item.href
                                                ? "bg-primary/10 text-primary"
                                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                        )}
                                    >
                                        {item.icon}
                                        {item.label}
                                    </Link>
                                ))}
                            </div>
                        )}

                        <div className="border-t pt-4 mt-4">
                            <Button
                                variant="ghost"
                                className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive h-12 text-base"
                                onClick={logout}
                            >
                                <LogOut className="h-5 w-5" />
                                Abmelden
                            </Button>
                        </div>
                    </nav>
                </div>
            )}
        </header>
    );
}

export default Header;

