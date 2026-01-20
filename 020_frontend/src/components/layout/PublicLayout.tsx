import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Calendar, Mail, Music, User, Menu, X } from 'lucide-react';

export function PublicLayout() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const location = useLocation();

    // Close menu when route changes
    if (isMobileMenuOpen) {
        // Simple effect to close menu on navigation
        // We could use useEffect but this is a quick inline check during render that might be anti-pattern
        // Better to use onClick on Links
    }

    const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
    const closeMenu = () => setIsMobileMenuOpen(false);

    return (
        <div className="min-h-screen flex flex-col bg-[hsl(var(--background))]">
            {/* Header */}
            <header className="bg-white border-b border-[hsl(var(--border))] sticky top-0 z-50 shadow-sm">
                <div className="container-app">
                    <div className="flex items-center justify-between h-20">
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity" onClick={closeMenu}>
                            <img src="/logo.png" alt="Musig Elgg Logo" className="h-14 w-auto" />
                            <div className="flex flex-col">
                                <span className="text-2xl font-bold text-[hsl(var(--musig-burgundy))]">
                                    Musig Elgg
                                </span>
                            </div>
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center gap-8">
                            <Link
                                to="/"
                                className={`text-sm font-medium transition-colors ${location.pathname === '/'
                                    ? 'text-[hsl(var(--musig-burgundy))] font-bold'
                                    : 'hover:text-[hsl(var(--musig-burgundy))]'
                                    }`}
                            >
                                Start
                            </Link>
                            <Link
                                to="/about"
                                className={`text-sm font-medium transition-colors ${location.pathname === '/about'
                                    ? 'text-[hsl(var(--musig-burgundy))] font-bold'
                                    : 'hover:text-[hsl(var(--musig-burgundy))]'
                                    }`}
                            >
                                Über uns
                            </Link>
                            <Link
                                to="/contact"
                                className={`text-sm font-medium transition-colors ${location.pathname === '/contact'
                                    ? 'text-[hsl(var(--musig-burgundy))] font-bold'
                                    : 'hover:text-[hsl(var(--musig-burgundy))]'
                                    }`}
                            >
                                Kontakt
                            </Link>
                            <Link
                                to="/login"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-md hover:bg-[hsl(var(--primary))]/90 transition-colors font-medium shadow-sm hover:shadow-md"
                            >
                                <User className="h-4 w-4" />
                                Mitgliederbereich
                            </Link>
                        </nav>

                        {/* Mobile Menu Button */}
                        <button
                            className="md:hidden p-2 text-[hsl(var(--musig-burgundy))] hover:bg-[hsl(var(--muted))] rounded-md transition-colors"
                            onClick={toggleMenu}
                            aria-label="Menu"
                        >
                            {isMobileMenuOpen ? (
                                <X className="h-6 w-6" />
                            ) : (
                                <Menu className="h-6 w-6" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation Dropdown */}
                {isMobileMenuOpen && (
                    <div className="md:hidden border-t border-[hsl(var(--border))] bg-white absolute w-full left-0 shadow-lg animate-in slide-in-from-top-2 duration-200">
                        <div className="container-app py-4 flex flex-col gap-2">
                            <Link
                                to="/"
                                className={`px-4 py-3 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${location.pathname === '/'
                                    ? 'bg-[hsl(var(--musig-burgundy))]/10 text-[hsl(var(--musig-burgundy))]'
                                    : 'hover:bg-[hsl(var(--muted))]'
                                    }`}
                                onClick={closeMenu}
                            >
                                <Music className="h-4 w-4" />
                                Start
                            </Link>
                            <Link
                                to="/about"
                                className={`px-4 py-3 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${location.pathname === '/about'
                                    ? 'bg-[hsl(var(--musig-burgundy))]/10 text-[hsl(var(--musig-burgundy))]'
                                    : 'hover:bg-[hsl(var(--muted))]'
                                    }`}
                                onClick={closeMenu}
                            >
                                <User className="h-4 w-4" />
                                Über uns
                            </Link>
                            <Link
                                to="/contact"
                                className={`px-4 py-3 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${location.pathname === '/contact'
                                    ? 'bg-[hsl(var(--musig-burgundy))]/10 text-[hsl(var(--musig-burgundy))]'
                                    : 'hover:bg-[hsl(var(--muted))]'
                                    }`}
                                onClick={closeMenu}
                            >
                                <Mail className="h-4 w-4" />
                                Kontakt
                            </Link>
                            <div className="h-px bg-[hsl(var(--border))] my-2" />
                            <Link
                                to="/login"
                                className="px-4 py-3 rounded-md text-sm font-medium text-[hsl(var(--musig-burgundy))] hover:bg-[hsl(var(--muted))] transition-colors flex items-center gap-2"
                                onClick={closeMenu}
                            >
                                <User className="h-4 w-4" />
                                Mitgliederbereich Login
                            </Link>
                        </div>
                    </div>
                )}
            </header>

            {/* Main Content */}
            <main className="flex-1">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="bg-[hsl(var(--musig-burgundy))] text-[hsl(var(--primary-foreground))] py-12 mt-auto">
                <div className="container-app">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* About */}
                        <div>
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <Music className="h-5 w-5 text-[hsl(var(--musig-gold))]" />
                                Musig Elgg
                            </h3>
                            <p className="text-sm text-[hsl(var(--primary-foreground))]/80 leading-relaxed">
                                Wir sind eine ganz neu gegründete Musig in Elgg. Wir spielen bei verschiedenen Anlässen in und um Elgg.
                            </p>
                        </div>

                        {/* Quick Links */}
                        <div>
                            <h3 className="font-bold text-lg mb-4">Quick Links</h3>
                            <ul className="space-y-2 text-sm">
                                <li>
                                    <Link to="/" className="hover:text-[hsl(var(--musig-gold))] transition-colors">
                                        Start
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/about" className="hover:text-[hsl(var(--musig-gold))] transition-colors">
                                        Über uns
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/contact" className="hover:text-[hsl(var(--musig-gold))] transition-colors">
                                        Kontakt
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/login" className="hover:text-[hsl(var(--musig-gold))] transition-colors">
                                        Mitgliederbereich
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Contact Info */}
                        <div>
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <Mail className="h-5 w-5 text-[hsl(var(--musig-gold))]" />
                                Kontakt
                            </h3>
                            <ul className="space-y-3 text-sm">
                                <li className="flex items-start gap-2">
                                    <Calendar className="h-4 w-4 mt-0.5 text-[hsl(var(--musig-gold))]" />
                                    <div>
                                        <div className="font-medium">Proben</div>
                                        <div className="text-[hsl(var(--primary-foreground))]/80">
                                            Jeden 2. Montag, 20:00 Uhr
                                        </div>
                                    </div>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Mail className="h-4 w-4 mt-0.5 text-[hsl(var(--musig-gold))]" />
                                    <div>
                                        <a
                                            href="mailto:info@musig-elgg.ch"
                                            className="hover:text-[hsl(var(--musig-gold))] transition-colors"
                                        >
                                            info@musig-elgg.ch
                                        </a>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-[hsl(var(--primary-foreground))]/20 mt-8 pt-8 text-center text-sm text-[hsl(var(--primary-foreground))]/60">
                        <p>&copy; {new Date().getFullYear()} Musig Elgg. Alle Rechte vorbehalten.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
