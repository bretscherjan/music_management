import { Mail, MapPin, Phone, Clock } from 'lucide-react';

export function ContactPage() {
    return (
        <div>
            {/* Hero Section */}
            <section className="bg-gradient-to-br from-[hsl(var(--musig-burgundy))] to-[hsl(var(--musig-burgundy))]/80 text-white py-20">
                <div className="container-app">
                    <div className="max-w-3xl mx-auto text-center">
                        <h1 className="text-5xl font-bold mb-6">Kontakt</h1>
                        <p className="text-xl text-white/90 leading-relaxed">
                            Haben Sie Fragen oder möchten Sie uns kennenlernen? Wir freuen uns auf Ihre Nachricht!
                        </p>
                    </div>
                </div>
            </section>

            {/* Contact Content */}
            <section className="py-16">
                <div className="container-app">
                    <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12">
                        {/* Contact Information */}
                        <div>
                            <h2 className="text-3xl font-bold text-[hsl(var(--musig-burgundy))] mb-8">
                                Kontaktinformationen
                            </h2>

                            <div className="space-y-6">
                                <ContactItem
                                    icon={<Mail className="h-6 w-6" />}
                                    title="E-Mail"
                                    content="info@musig-elgg.ch"
                                    link="mailto:info@musig-elgg.ch"
                                />

                                <ContactItem
                                    icon={<Phone className="h-6 w-6" />}
                                    title="Telefon"
                                    content="+41 52 XXX XX XX"
                                    link="tel:+41521234567"
                                />

                                <ContactItem
                                    icon={<MapPin className="h-6 w-6" />}
                                    title="Adresse"
                                    content="Probelokal Musig Elgg"
                                    subtitle="8353 Elgg, Schweiz"
                                />

                                <ContactItem
                                    icon={<Clock className="h-6 w-6" />}
                                    title="Probenzeiten"
                                    content="Jeden Montag, 20:00 Uhr"
                                    subtitle="Gäste sind herzlich willkommen!"
                                />
                            </div>

                            {/* Map Placeholder */}
                            <div className="mt-8 bg-gradient-to-br from-[hsl(var(--musig-gold))]/10 to-[hsl(var(--musig-burgundy))]/10 rounded-xl border-2 border-[hsl(var(--musig-gold))]/30 p-8 text-center">
                                <MapPin className="h-12 w-12 text-[hsl(var(--musig-burgundy))] mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-[hsl(var(--musig-burgundy))] mb-2">
                                    Besuchen Sie uns
                                </h3>
                                <p className="text-[hsl(var(--muted-foreground))]">
                                    Unser Probelokal befindet sich im Herzen von Elgg
                                </p>
                            </div>
                        </div>

                        {/* Contact Form */}
                        <div>
                            <h2 className="text-3xl font-bold text-[hsl(var(--musig-burgundy))] mb-8">
                                Nachricht senden
                            </h2>

                            <form className="space-y-6">
                                <div>
                                    <label
                                        htmlFor="name"
                                        className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2"
                                    >
                                        Name
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        className="w-full px-4 py-3 rounded-lg border border-[hsl(var(--border))] focus:ring-2 focus:ring-[hsl(var(--musig-burgundy))] focus:border-transparent outline-none transition-all"
                                        placeholder="Ihr Name"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="email"
                                        className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2"
                                    >
                                        E-Mail
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        className="w-full px-4 py-3 rounded-lg border border-[hsl(var(--border))] focus:ring-2 focus:ring-[hsl(var(--musig-burgundy))] focus:border-transparent outline-none transition-all"
                                        placeholder="ihre.email@beispiel.ch"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="subject"
                                        className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2"
                                    >
                                        Betreff
                                    </label>
                                    <input
                                        type="text"
                                        id="subject"
                                        className="w-full px-4 py-3 rounded-lg border border-[hsl(var(--border))] focus:ring-2 focus:ring-[hsl(var(--musig-burgundy))] focus:border-transparent outline-none transition-all"
                                        placeholder="Worum geht es?"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="message"
                                        className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2"
                                    >
                                        Nachricht
                                    </label>
                                    <textarea
                                        id="message"
                                        rows={6}
                                        className="w-full px-4 py-3 rounded-lg border border-[hsl(var(--border))] focus:ring-2 focus:ring-[hsl(var(--musig-burgundy))] focus:border-transparent outline-none transition-all resize-none"
                                        placeholder="Ihre Nachricht an uns..."
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-[hsl(var(--musig-burgundy))] text-white px-6 py-3 rounded-lg hover:bg-[hsl(var(--musig-burgundy))]/90 transition-colors font-medium flex items-center justify-center gap-2"
                                >
                                    <Mail className="h-5 w-5" />
                                    Nachricht senden
                                </button>
                            </form>

                            <div className="mt-6 p-4 bg-[hsl(var(--musig-gold))]/10 rounded-lg border border-[hsl(var(--musig-gold))]/30">
                                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                                    <strong className="text-[hsl(var(--musig-burgundy))]">Hinweis:</strong> Das Kontaktformular
                                    wird zurzeit noch implementiert. In der Zwischenzeit können Sie uns direkt per E-Mail erreichen.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Call to Action */}
            <section className="py-16 bg-gradient-to-r from-[hsl(var(--musig-burgundy))]/5 to-[hsl(var(--musig-gold))]/5">
                <div className="container-app">
                    <div className="max-w-3xl mx-auto text-center">
                        <h2 className="text-3xl font-bold text-[hsl(var(--musig-burgundy))] mb-4">
                            Schnupperprobe gewünscht?
                        </h2>
                        <p className="text-lg text-[hsl(var(--muted-foreground))] mb-6 leading-relaxed">
                            Sie möchten uns persönlich kennenlernen? Kommen Sie doch einfach bei einer unserer
                            Proben vorbei – jeden Montag um 20:00 Uhr. Eine Anmeldung ist nicht erforderlich!
                        </p>
                        <div className="inline-flex items-center gap-2 text-[hsl(var(--musig-burgundy))] font-medium">
                            <Clock className="h-5 w-5" />
                            Montag, 20:00 Uhr im Probelokal Elgg
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

interface ContactItemProps {
    icon: React.ReactNode;
    title: string;
    content: string;
    subtitle?: string;
    link?: string;
}

function ContactItem({ icon, title, content, subtitle, link }: ContactItemProps) {
    const ContentWrapper = link ? 'a' : 'div';
    const wrapperProps = link ? { href: link, className: 'hover:text-[hsl(var(--musig-burgundy))] transition-colors' } : {};

    return (
        <div className="flex items-start gap-4">
            <div className="bg-gradient-to-br from-[hsl(var(--musig-burgundy))] to-[hsl(var(--musig-burgundy))]/80 text-white w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
                {icon}
            </div>
            <div>
                <div className="text-sm text-[hsl(var(--muted-foreground))] mb-1">{title}</div>
                <ContentWrapper {...wrapperProps} className={`text-lg font-medium text-[hsl(var(--foreground))] ${link ? 'hover:text-[hsl(var(--musig-burgundy))] transition-colors' : ''}`}>
                    {content}
                </ContentWrapper>
                {subtitle && (
                    <div className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
                        {subtitle}
                    </div>
                )}
            </div>
        </div>
    );
}
