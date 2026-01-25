import { Link } from 'react-router-dom';
import { Calendar, Mail, Music } from 'lucide-react';

export function Footer() {
    return (
        <footer className="bg-[hsl(var(--musig-primary))] text-[hsl(var(--primary-foreground))] py-12 mt-auto">
            <div className="container-app">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* About */}
                    <div>
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <Music className="h-5 w-5 text-[hsl(var(--musig-contrast))]" />
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
                                <Link to="/" className="hover:text-[hsl(var(--musig-contrast))] transition-colors">
                                    Start
                                </Link>
                            </li>
                            <li>
                                <Link to="/about" className="hover:text-[hsl(var(--musig-contrast))] transition-colors">
                                    Über uns
                                </Link>
                            </li>
                            <li>
                                <Link to="/contact" className="hover:text-[hsl(var(--musig-contrast))] transition-colors">
                                    Kontakt
                                </Link>
                            </li>
                            <li>
                                <Link to="/login" className="hover:text-[hsl(var(--musig-contrast))] transition-colors">
                                    Mitgliederbereich
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <Mail className="h-5 w-5 text-[hsl(var(--musig-contrast))]" />
                            Kontakt
                        </h3>
                        <ul className="space-y-3 text-sm">
                            <li className="flex items-start gap-2">
                                <Calendar className="h-4 w-4 mt-0.5 text-[hsl(var(--musig-contrast))]" />
                                <div>
                                    <div className="font-medium">Proben:</div>
                                    <div className="text-[hsl(var(--primary-foreground))]/80">
                                        Jeden 2. Montag, 20:00 Uhr
                                    </div>
                                </div>
                            </li>
                            <li className="flex items-start gap-2">
                                <Mail className="h-4 w-4 mt-0.5 text-[hsl(var(--musig-contrast))]" />
                                <div>
                                    <a
                                        href="mailto:info@musig-elgg.ch"
                                        className="hover:text-[hsl(var(--musig-contrast))] transition-colors"
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
    );
}