import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, Settings } from 'lucide-react';

export function Header() {
    const { logout } = useAuth();
    const navigate = useNavigate();

    return (
        <header className="fixed top-0 inset-x-0 z-50 w-full border-b border-slate-200 bg-card/95 backdrop-blur-md supports-[backdrop-filter]:bg-card/90 pt-safe">
            <div className="container-app flex h-[var(--header-height)] items-center justify-between">
                <Link to="/member" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <img src={'/logos/logo_smile.svg'} alt="Musig Elgg Logo" className="h-8 w-8 rounded-full object-cover" />
                    <div className="flex flex-col">
                        <span className="font-bold text-lg leading-tight">Musig Elgg</span>
                        <span className="text-xs text-muted-foreground">Mitgliederbereich</span>
                    </div>
                </Link>

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
                </div>
            </div>
        </header>
    );
}

export default Header;

