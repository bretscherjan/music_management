import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, useIsAdmin } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
    Calendar,
    Users,
    FileText,
    Home,
    LogOut,
    Menu,
    X,
    Music,
    Newspaper,
    Settings,
    Library,
    BarChart,
    Folder
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';


interface NavItem {
    label: string;
    href: string;
    icon: React.ReactNode;
    adminOnly?: boolean;
}

const navItems: NavItem[] = [
    { label: 'Dashboard', href: '/member', icon: <Home className="h-5 w-5" /> },
    { label: 'Termine', href: '/member/events', icon: <Calendar className="h-5 w-5" /> },
    { label: 'Termine Admin', href: '/member/admin/events', icon: <Calendar className="h-5 w-5" />, adminOnly: true },
    { label: 'Dateien', href: '/member/files', icon: <FileText className="h-5 w-5" /> },
    { label: 'Mappen', href: '/member/music-folders', icon: <Folder className="h-5 w-5" /> },
    { label: 'Mitglieder', href: '/member/members', icon: <Users className="h-5 w-5" /> }, // Accessible to all
    { label: 'Noten', href: '/member/admin/sheet-music', icon: <Library className="h-5 w-5" />, adminOnly: true },
    { label: 'Register', href: '/member/admin/registers', icon: <Music className="h-5 w-5" />, adminOnly: true },
    { label: 'News', href: '/member/admin/news', icon: <Newspaper className="h-5 w-5" />, adminOnly: true },
    { label: 'Statistiken', href: '/member/admin/statistics', icon: <BarChart className="h-5 w-5" />, adminOnly: true },
];

export function Header() {
    const { user, logout } = useAuth();
    const isAdmin = useIsAdmin();
    const location = useLocation();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const filteredNavItems = navItems.filter(item => !item.adminOnly || isAdmin);

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
            <div className="container-app flex h-16 items-center justify-between">
                {/* Logo */}
                <Link to="/member" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <Music className="h-8 w-8 text-primary" />
                    <div className="hidden sm:flex flex-col">
                        <span className="font-bold text-lg leading-tight">Musig Elgg</span>
                        <span className="text-xs text-muted-foreground">Mitgliederbereich</span>
                    </div>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-1">
                    {filteredNavItems.map((item) => (
                        <Link
                            key={item.href}
                            to={item.href}
                            className={cn(
                                "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
                                location.pathname === item.href
                                    ? "bg-primary/10 text-primary font-semibold"
                                    : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
                            )}
                        >
                            {item.icon}
                            {item.label}
                        </Link>
                    ))}
                </nav>

                {/* User Menu */}
                <div className="flex items-center gap-4">
                    <div className="hidden sm:block text-sm text-muted-foreground">
                        {user?.firstName} {user?.lastName}
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate('/member/settings')}
                        title="Einstellungen"
                    >
                        <Settings className="h-5 w-5" />
                    </Button>

                    <Button variant="ghost" size="icon" onClick={logout} title="Abmelden">
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

            {/* Mobile Navigation */}
            {mobileMenuOpen && (
                <nav className="md:hidden border-t bg-background p-4 space-y-2">
                    {filteredNavItems.map((item) => (
                        <Link
                            key={item.href}
                            to={item.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-md text-base font-medium transition-colors",
                                location.pathname === item.href
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            )}
                        >
                            {item.icon}
                            {item.label}
                        </Link>
                    ))}
                </nav>
            )}
        </header>
    );
}

export default Header;
