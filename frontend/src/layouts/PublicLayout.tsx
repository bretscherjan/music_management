import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Menu, X, Facebook, Instagram, Mail } from 'lucide-react';

const PublicLayout = () => {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    return (
        <div className="flex flex-col min-h-screen font-body text-charcoal bg-white">
            {/* Header */}
            <header className="fixed w-full z-50 bg-white/95 backdrop-blur-sm shadow-md transition-all duration-300">
                <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                    {/* Logo & Brand */}
                    <Link to="/" className="flex items-center space-x-3 group">
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-secondary font-heading font-bold text-xl group-hover:bg-secondary group-hover:text-primary transition-colors">
                            ME
                        </div>
                        <span className="font-heading text-2xl font-bold tracking-tight text-primary">
                            MUSIG <span className="text-secondary">ELGG</span>
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center space-x-8">
                        <NavLink to="/">Home</NavLink>
                        <NavLink to="/news">News</NavLink>
                        <NavLink to="/agenda">Agenda</NavLink>
                        <NavLink to="/about">Über Uns</NavLink>
                        <NavLink to="/contact">Kontakt</NavLink>
                        <Link
                            to="/login"
                            className="bg-primary text-white px-5 py-2 rounded-full font-bold hover:bg-secondary transition-colors duration-300 shadow-sm"
                        >
                            Mitglieder
                        </Link>
                    </nav>

                    {/* Mobile Menu Toggle */}
                    <button
                        className="md:hidden text-primary focus:outline-none"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
                    </button>
                </div>

                {/* Mobile Navigation Dropdown */}
                {isMenuOpen && (
                    <div className="md:hidden bg-white border-t border-gray-100 shadow-lg absolute w-full">
                        <div className="flex flex-col p-4 space-y-4">
                            <MobileNavLink to="/" onClick={() => setIsMenuOpen(false)}>Home</MobileNavLink>
                            <MobileNavLink to="/news" onClick={() => setIsMenuOpen(false)}>News</MobileNavLink>
                            <MobileNavLink to="/agenda" onClick={() => setIsMenuOpen(false)}>Agenda</MobileNavLink>
                            <MobileNavLink to="/about" onClick={() => setIsMenuOpen(false)}>Über Uns</MobileNavLink>
                            <MobileNavLink to="/contact" onClick={() => setIsMenuOpen(false)}>Kontakt</MobileNavLink>
                            <Link
                                to="/login"
                                className="bg-primary text-white px-4 py-2 rounded text-center font-bold"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Mitglieder Login
                            </Link>
                        </div>
                    </div>
                )}
            </header>

            {/* Main Content (Offset for fixed header) */}
            <main className="flex-grow pt-16">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="bg-charcoal text-white pt-12 pb-6">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                        {/* Column 1: Brand */}
                        <div>
                            <h3 className="font-heading text-2xl font-bold text-secondary mb-4">Musig Elgg</h3>
                            <p className="text-gray-300 leading-relaxed">
                                Tradition trifft Moderne. Wir sind der Musikverein aus Elgg und begeistern mit vielfältigen Klängen.
                            </p>
                        </div>

                        {/* Column 2: Quick Links */}
                        <div>
                            <h4 className="font-heading text-lg font-bold mb-4 border-b border-gray-600 pb-2 w-max text-white">Links</h4>
                            <ul className="space-y-2">
                                <li><Link to="/agenda" className="text-gray-300 hover:text-secondary transition-colors">Nächste Auftritte</Link></li>
                                <li><Link to="/join" className="text-gray-300 hover:text-secondary transition-colors">Mitmachen</Link></li>
                                <li><Link to="/contact" className="text-gray-300 hover:text-secondary transition-colors">Kontakt</Link></li>
                                <li><Link to="/impressum" className="text-gray-300 hover:text-secondary transition-colors">Impressum</Link></li>
                            </ul>
                        </div>

                        {/* Column 3: Contact */}
                        <div>
                            <h4 className="font-heading text-lg font-bold mb-4 border-b border-gray-600 pb-2 w-max text-white">Kontakt</h4>
                            <div className="text-gray-300 space-y-2">
                                <p>Postfach 123</p>
                                <p>8353 Elgg</p>
                                <div className="flex items-center space-x-2 mt-4">
                                    <Mail size={18} className="text-secondary" />
                                    <a href="mailto:info@musigelgg.ch" className="hover:text-white transition-colors">info@musigelgg.ch</a>
                                </div>
                                <div className="flex space-x-4 mt-4">
                                    <a href="#" className="bg-gray-700 p-2 rounded-full hover:bg-secondary hover:text-white transition-all">
                                        <Facebook size={20} />
                                    </a>
                                    <a href="#" className="bg-gray-700 p-2 rounded-full hover:bg-secondary hover:text-white transition-all">
                                        <Instagram size={20} />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-700 pt-6 text-center text-gray-500 text-sm">
                        &copy; {new Date().getFullYear()} Musig Elgg. Alle Rechte vorbehalten.
                    </div>
                </div>
            </footer>
        </div>
    );
};

// Helper Components
const NavLink = ({ to, children }: { to: string, children: React.ReactNode }) => (
    <Link
        to={to}
        className="text-charcoal hover:text-primary font-medium tracking-wide transition-colors duration-200 relative group"
    >
        {children}
        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-secondary transition-all duration-300 group-hover:w-full"></span>
    </Link>
);

const MobileNavLink = ({ to, onClick, children }: { to: string, onClick: () => void, children: React.ReactNode }) => (
    <Link
        to={to}
        className="text-charcoal font-medium text-lg border-b border-gray-100 pb-2 hover:text-primary transition-colors"
        onClick={onClick}
    >
        {children}
    </Link>
);

export default PublicLayout;
