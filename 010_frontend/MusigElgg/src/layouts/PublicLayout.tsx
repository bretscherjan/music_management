import { Outlet, Link, useLocation } from 'react-router-dom';
import { Calendar, Home, Info, LogIn, Music } from 'lucide-react';

const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Calendar, label: 'Anlässe', path: '/events' },
    { icon: Info, label: 'Über uns', path: '/about' },
];

export function PublicLayout() {
    const location = useLocation();

    return (
        <div className="min-h-screen flex flex-col bg-neutral-50">
            {/* Header */}
            <header className="sticky top-0 z-50 glass-effect border-b border-neutral-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-3 group">
                            <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center shadow-elegant group-hover:shadow-glow transition-shadow">
                                <Music className="text-white" size={22} />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-primary-800">Musig Elgg</h1>
                                <p className="text-xs text-neutral-500">Musikverein seit 1896</p>
                            </div>
                        </Link>

                        {/* Navigation */}
                        <nav className="hidden md:flex items-center gap-1">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = location.pathname === item.path;

                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={`
                      flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
                      ${isActive
                                                ? 'bg-primary-800 text-white'
                                                : 'text-neutral-700 hover:bg-neutral-100 hover:text-primary-800'
                                            }
                    `}
                                    >
                                        <Icon size={18} />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* Login Button */}
                        <Link
                            to="/login"
                            className="flex items-center gap-2 px-4 py-2 bg-secondary-500 text-white rounded-lg font-medium hover:bg-secondary-600 transition-colors shadow-elegant"
                        >
                            <LogIn size={18} />
                            <span className="hidden sm:inline">Mitglieder Login</span>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Mobile Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-effect border-t border-neutral-200">
                <div className="flex justify-around py-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`
                  flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors
                  ${isActive
                                        ? 'text-primary-800'
                                        : 'text-neutral-500'
                                    }
                `}
                            >
                                <Icon size={22} />
                                <span className="text-xs font-medium">{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>

            {/* Main Content */}
            <main className="flex-1">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="bg-primary-900 text-white py-12 mb-16 md:mb-0">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* About */}
                        <div>
                            <h3 className="text-lg font-bold text-secondary-400 mb-4">Musig Elgg</h3>
                            <p className="text-neutral-300 text-sm leading-relaxed">
                                Seit 1896 pflegen wir die Blasmusiktradition in Elgg und der Region.
                                Unsere Leidenschaft für Musik verbindet Generationen.
                            </p>
                        </div>

                        {/* Quick Links */}
                        <div>
                            <h3 className="text-lg font-bold text-secondary-400 mb-4">Links</h3>
                            <ul className="space-y-2">
                                <li>
                                    <Link to="/events" className="text-neutral-300 hover:text-secondary-400 transition-colors text-sm">
                                        Kommende Anlässe
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/about" className="text-neutral-300 hover:text-secondary-400 transition-colors text-sm">
                                        Über den Verein
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/login" className="text-neutral-300 hover:text-secondary-400 transition-colors text-sm">
                                        Mitgliederbereich
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Contact */}
                        <div>
                            <h3 className="text-lg font-bold text-secondary-400 mb-4">Kontakt</h3>
                            <address className="text-neutral-300 text-sm not-italic leading-relaxed">
                                Musig Elgg<br />
                                8353 Elgg<br />
                                <a href="mailto:info@musig-elgg.ch" className="hover:text-secondary-400 transition-colors">
                                    info@musig-elgg.ch
                                </a>
                            </address>
                        </div>
                    </div>

                    <div className="mt-8 pt-8 border-t border-primary-800 text-center text-neutral-400 text-sm">
                        © {new Date().getFullYear()} Musig Elgg. Alle Rechte vorbehalten.
                    </div>
                </div>
            </footer>
        </div>
    );
}
