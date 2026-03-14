import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Mail, Music, User, Menu, X, Image, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { cmsService } from '@/services/cmsService';

export function Navbar() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const location = useLocation();

    const { data: galleryImages = [] } = useQuery({
        queryKey: ['gallery', 'count'],
        queryFn: () => cmsService.getGalleryImages(),
        staleTime: 60000 // Only check every minute
    });

    const hasGallery = galleryImages.length > 0;
    const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
    const closeMenu = () => setIsMobileMenuOpen(false);

    return (
        <header className="bg-white border-b border-[hsl(var(--border))] sticky top-0 z-50 shadow-sm">
            <div className="container-app">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity" onClick={closeMenu}>
                        <img src="/public/musig.png" alt="Musig Elgg Logo" className="h-14 w-auto" />
                        <div className="flex flex-col">
                            <span className="text-2xl font-bold text-foreground">Elgg</span>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-8">
                        <Link
                            to="/"
                            className={`text-sm font-medium transition-colors ${location.pathname === '/'
                                ? 'text-brand-primary font-bold'
                                : 'hover:text-brand-primary'
                                }`}
                        >
                            Start
                        </Link>
                        <Link
                            to="/events"
                            className={`text-sm font-medium transition-colors ${location.pathname === '/events'
                                ? 'text-brand-primary font-bold'
                                : 'hover:text-brand-primary'
                                }`}
                        >
                            Termine
                        </Link>
                        {hasGallery && (
                            <Link
                                to="/gallery"
                                className={`text-sm font-medium transition-colors ${location.pathname === '/gallery'
                                    ? 'text-brand-primary font-bold'
                                    : 'hover:text-brand-primary'
                                    }`}
                            >
                                Galerie
                            </Link>
                        )}
                        <Link
                            to="/about"
                            className={`text-sm font-medium transition-colors ${location.pathname === '/about'
                                ? 'text-brand-primary font-bold'
                                : 'hover:text-brand-primary'
                                }`}
                        >
                            Über uns
                        </Link>
                        <Link
                            to="/contact"
                            className={`text-sm font-medium transition-colors ${location.pathname === '/contact'
                                ? 'text-brand-primary font-bold'
                                : 'hover:text-brand-primary'
                                }`}
                        >
                            Kontakt
                        </Link>
                        <Link
                            to="/login"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-primary/90 transition-colors font-medium shadow-sm hover:shadow-md"
                        >
                            <User className="h-4 w-4" />
                            Mitgliederbereich
                        </Link>
                    </nav>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 text-brand-primary hover:bg-[hsl(var(--muted))] rounded-md transition-colors"
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
                                ? 'bg-brand-primary/10 text-brand-primary'
                                : 'hover:bg-[hsl(var(--muted))]'
                                }`}
                            onClick={closeMenu}
                        >
                            <Music className="h-4 w-4" />
                            Start
                        </Link>
                        <Link
                            to="/events"
                            className={`px-4 py-3 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${location.pathname === '/events'
                                ? 'bg-brand-primary/10 text-brand-primary'
                                : 'hover:bg-[hsl(var(--muted))]'
                                }`}
                            onClick={closeMenu}
                        >
                            <Calendar className="h-4 w-4" />
                            Termine
                        </Link>
                        {hasGallery && (
                            <Link
                                to="/gallery"
                                className={`px-4 py-3 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${location.pathname === '/gallery'
                                    ? 'bg-brand-primary/10 text-brand-primary'
                                    : 'hover:bg-[hsl(var(--muted))]'
                                    }`}
                                onClick={closeMenu}
                            >
                                <Image className="h-4 w-4" />
                                Galerie
                            </Link>
                        )}
                        <Link
                            to="/about"
                            className={`px-4 py-3 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${location.pathname === '/about'
                                ? 'bg-brand-primary/10 text-brand-primary'
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
                                ? 'bg-brand-primary/10 text-brand-primary'
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
                            className="px-4 py-3 rounded-md text-sm font-medium text-brand-primary hover:bg-[hsl(var(--muted))] transition-colors flex items-center gap-2"
                            onClick={closeMenu}
                        >
                            <User className="h-4 w-4" />
                            Mitgliederbereich Login
                        </Link>
                    </div>
                </div>
            )}
        </header>
    );
}
