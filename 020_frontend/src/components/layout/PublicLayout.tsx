import { Link, Outlet } from 'react-router-dom';
import { Calendar, Mail, Music, User } from 'lucide-react';

export function PublicLayout() {
    return (
        <div className="min-h-screen flex flex-col bg-[hsl(var(--background))]">
            {/* Header */}
            <header className="bg-white border-b border-[hsl(var(--border))] sticky top-0 z-50 shadow-sm">
                <div className="container-app">
                    <div className="flex items-center justify-between h-20">
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                            <img src="/logo.png" alt="Musig Elgg Logo" className="h-14 w-auto" />
                            <div className="flex flex-col">
                                <span className="text-2xl font-bold text-[hsl(var(--musig-burgundy))]">
                                    Musig Elgg
                                </span>
                                <span className="text-xs text-[hsl(var(--muted-foreground))]">
                                    Musikverein seit 1896
                                </span>
                            </div>
                        </Link>

                        {/* Navigation */}
                        <nav className="hidden md:flex items-center gap-8">
                            <Link
                                to="/"
                                className="text-sm font-medium hover:text-[hsl(var(--musig-burgundy))] transition-colors"
                            >
                                Start
                            </Link>
                            <Link
                                to="/about"
                                className="text-sm font-medium hover:text-[hsl(var(--musig-burgundy))] transition-colors"
                            >
                                Über uns
                            </Link>
                            <Link
                                to="/contact"
                                className="text-sm font-medium hover:text-[hsl(var(--musig-burgundy))] transition-colors"
                            >
                                Kontakt
                            </Link>
                            <Link
                                to="/login"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-md hover:bg-[hsl(var(--primary))]/90 transition-colors font-medium"
                            >
                                <User className="h-4 w-4" />
                                Mitgliederbereich
                            </Link>
                        </nav>

                        {/* Mobile Menu Button */}
                        <button className="md:hidden p-2">
                            <Music className="h-6 w-6 text-[hsl(var(--musig-burgundy))]" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="bg-[hsl(var(--musig-burgundy))] text-[hsl(var(--primary-foreground))] py-12 mt-20">
                <div className="container-app">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* About */}
                        <div>
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <Music className="h-5 w-5 text-[hsl(var(--musig-gold))]" />
                                Musig Elgg
                            </h3>
                            <p className="text-sm text-[hsl(var(--primary-foreground))]/80 leading-relaxed">
                                Traditioneller Musikverein aus Elgg mit über 125 Jahren Geschichte.
                                Wir spielen bei verschiedenen Anlässen und proben wöchentlich.
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
                                            Montag, 20:00 Uhr
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
