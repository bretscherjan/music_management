import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, useIsAdmin } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
    Calendar,
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
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';


interface NavItem {
    label: string;
    href: string;
    icon: React.ReactNode;
    adminOnly?: boolean;
}

const mainNavItems: NavItem[] = [
    { label: 'Termine', href: '/member/events', icon: <Calendar className="h-5 w-5" /> },
    { label: 'Dateien', href: '/member/files', icon: <FileText className="h-5 w-5" /> },
    { label: 'Mappen', href: '/member/music-folders', icon: <Folder className="h-5 w-5" /> },
    { label: 'Mitglieder', href: '/member/members', icon: <Users className="h-5 w-5" /> },
];

const adminNavItems: NavItem[] = [
    { label: 'Termine admin', href: '/member/admin/events', icon: <Calendar className="h-5 w-5" />, adminOnly: true },
    { label: 'Workspace', href: '/member/admin/workspace', icon: <Folder className="h-5 w-5" />, adminOnly: true },
    { label: 'Noten', href: '/member/admin/sheet-music', icon: <Library className="h-5 w-5" />, adminOnly: true },
    { label: 'Register', href: '/member/admin/registers', icon: <Music className="h-5 w-5" />, adminOnly: true },
    { label: 'News', href: '/member/admin/news', icon: <Newspaper className="h-5 w-5" />, adminOnly: true },
    { label: 'Statistiken', href: '/member/admin/statistics', icon: <BarChart className="h-5 w-5" />, adminOnly: true },
    { label: 'Engagement', href: '/member/admin/engagement', icon: <Activity className="h-5 w-5" />, adminOnly: true },
    { label: 'Protokoll', href: '/member/admin/protokoll', icon: <ClipboardList className="h-5 w-5" />, adminOnly: true },
];

export function Header() {
    const { logout } = useAuth();
    const isAdmin = useIsAdmin();
    const location = useLocation();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
            <div className="container-app flex h-16 items-center justify-between">
                {/* Logo & Mobile Menu Trigger (Left align on mobile?) No, standart right aligned hamburger usually. */}
                <Link to="/member" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <Music className="h-8 w-8 text-primary" />
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
                            {mainNavItems.map((item) => (
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

                        {isAdmin && (
                            <div className="space-y-1">
                                <div className="flex items-center px-4 mb-2 gap-2 text-muted-foreground">
                                    <Shield className="h-3 w-3" />
                                    <h4 className="text-xs font-semibold uppercase tracking-wider">
                                        Verwaltung
                                    </h4>
                                </div>
                                {adminNavItems.map((item) => (
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

