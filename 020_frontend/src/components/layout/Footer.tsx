import { Link } from 'react-router-dom';
import { Calendar, Mail, Music } from 'lucide-react';

export function Footer() {
    return (
        <footer className="bg-[#1A1A1B] text-white py-16 mt-auto">
            <div className="container-app">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
                    {/* About */}
                    <div>
                        <h3 className="font-bold text-xl mb-6 flex items-center gap-2 justify-center md:justify-start">
                            <Music className="h-6 w-6 text-brand-primary" />
                            Musig Elgg
                        </h3>
                        <p className="text-base text-white/60 leading-relaxed max-w-sm mx-auto md:mx-0">
                            Wir verbinden Tradition mit moderner Spielfreude. Als Dorfmusikverein von Elgg gestalten wir das kulturelle Leben aktiv mit.
                        </p>
                    </div>

                    {/* Links */}
                    <div>
                        <h3 className="font-bold text-xl mb-6">Navigation</h3>
                        <ul className="space-y-3 text-base">
                            <li>
                                <Link to="/" className="text-white/60 hover:text-brand-primary transition-colors">
                                    Startseite
                                </Link>
                            </li>
                            <li>
                                <Link to="/events" className="text-white/60 hover:text-brand-primary transition-colors">
                                    Termine & Konzerte
                                </Link>
                            </li>
                            <li>
                                <Link to="/about" className="text-white/60 hover:text-brand-primary transition-colors">
                                    Über den Verein
                                </Link>
                            </li>
                            <li>
                                <Link to="/contact" className="text-white/60 hover:text-brand-primary transition-colors">
                                    Kontakt & Mitmachen
                                </Link>
                            </li>
                            <li>
                                <Link to="/login" className="text-white/60 hover:text-brand-primary transition-colors">
                                    Mitgliederlogin
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h3 className="font-bold text-xl mb-6 flex items-center gap-2 justify-center md:justify-start">
                            <Mail className="h-6 w-6 text-brand-primary" />
                            Kontakt
                        </h3>
                        <ul className="space-y-4 text-base">
                            <li className="flex items-start gap-4 justify-center md:justify-start">
                                <Calendar className="h-5 w-5 mt-1 text-brand-primary/80 shrink-0" />
                                <div className="text-left">
                                    <div className="font-semibold text-white">Proben & Treffpunkt</div>
                                    <div className="text-white/60">
                                        Primarschule "Im See", Elgg<br />
                                        Jeden 2. Montag, 20:00 Uhr
                                    </div>
                                </div>
                            </li>
                            <li className="flex items-start gap-4 justify-center md:justify-start">
                                <Mail className="h-5 w-5 mt-1 text-brand-primary/80 shrink-0" />
                                <div>
                                    <a
                                        href="mailto:info@musig-elgg.ch"
                                        className="text-white/60 hover:text-brand-primary transition-colors"
                                    >
                                        info@musig-elgg.ch
                                    </a>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/10 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-white/40">
                    <p>&copy; {new Date().getFullYear()} Musig Elgg - Alle Rechte vorbehalten.</p>
                    <div className="flex gap-6">
                        <Link to="/contact" className="hover:text-white transition-colors">Impressum</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}