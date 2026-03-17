import { Calendar, Mail } from 'lucide-react';
import praesidentinImg from '../../img/praesidentin1.jpeg';
import kassierImg from '../../img/kassier.jpeg';
import aktuarImg from '../../img/aktuar.jpg';

export function AboutPage() {
    return (
        <div className="bg-background">
            {/* Hero Section */}
            <section className="py-20 md:py-32 bg-background border-b border-border/50">
                <div className="container-app">
                    <div className="max-w-4xl mx-auto text-center px-4">
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-8 tracking-tighter text-foreground">
                            Über d'Musig Elgg
                        </h1>
                        <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                            Die Musig Elgg – eine kürzlich gegründete Musig mit Engagement und Begeisterung
                        </p>
                    </div>
                </div>
            </section>

            {/* Geschichte */}
            <section className="py-24 bg-card">
                <div className="container-app">
                    <div className="max-w-5xl mx-auto">
                        <div className="grid lg:grid-cols-5 gap-8 lg:gap-16 items-center mb-12 lg:mb-24">
                            <div className="lg:col-span-3 text-center lg:text-left">
                                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-8 text-center lg:text-left">
                                    Unsere Gründung
                                </h2>
                                <div className="space-y-6 text-muted-foreground text-lg leading-relaxed">
                                    <p>
                                        Die Musig Elgg wurde im Jahr <strong className="text-brand-primary">2026</strong> gegründet.
                                    </p>
                                    <p>
                                        Wir sind eine junge Musig mit Engagement und Begeisterung.
                                    </p>
                                    <p>
                                        Aktuell zählen wir etwa <strong className="text-brand-primary">22 Mitspieler*innen</strong> jeder Altersklasse, die regelmässig gemeinsam musizieren und für Auftritte und Ständchen Proben.
                                    </p>
                                </div>
                            </div>
                            <div className="lg:col-span-2">
                                <div className="bg-background rounded-[2.5rem] p-8 lg:p-12 border border-border/10 shadow-xl relative overflow-hidden group">
                                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-primary/5 rounded-full blur-3xl group-hover:bg-brand-primary/10 transition-colors"></div>
                                    <div className="text-center relative z-10">
                                        <div className="text-8xl font-black text-brand-primary mb-4 tracking-tighter">
                                            22
                                        </div>
                                        <div className="text-2xl font-bold text-foreground mb-2">
                                            Aktive Mitspieler*innen
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Vorstand / Team */}
                        <div className="text-center mb-16 px-4">
                            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                                Der Vorstand
                            </h2>
                        </div>

                        <div className="grid md:grid-cols-3 gap-10 px-4 md:px-0">
                            <FeatureCard
                                img={praesidentinImg}
                                title="Präsidentin"
                                description="Ramona Egli"
                                email1="praesident@musig-elgg.ch"
                            />
                            <FeatureCard
                                img={kassierImg}
                                title="Dirigent"
                                description="Christian Meier"
                                email1="dirigent@musig-elgg.ch"
                            />
                            <FeatureCard
                                img={aktuarImg}
                                title="Aktuar"
                                description="Jan Bretscher"
                                email1="aktuar@musig-elgg.ch"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Jungbläser & Ausbildung */}
            <section className="py-24 bg-background overflow-hidden relative">
                <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-brand-primary/10 to-transparent"></div>
                <div className="container-app relative z-10">
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-card rounded-[3rem] border border-border/20 p-6 md:p-10 shadow-inner overflow-hidden relative">
                            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-brand-primary/5 rounded-full blur-3xl"></div>
                            <div className="text-center mb-12">
                                <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
                                    Jungbläser
                                </h2>
                                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                                    Musik verbindet Generationen – wir möchten gerne mit Musikanntinnen und Musikanten jeder Alterstufe zusammenarbeiten, deshalb freuen wir uns über jeden Jungbläser bei uns.
                                </p>
                            </div>

                            <div className="grid md:grid-cols-1 gap-10 items-center">
                                <div className="bg-background rounded-3xl p-8 border border-border/10 shadow-sm">
                                    <h3 className="text-2xl font-bold text-foreground text-center mb-4">
                                        Flexibilität für den Nachwuchs
                                    </h3>
                                    <div className="space-y-3">
                                        <p className="text-muted-foreground leading-relaxed mt-3">
                                            Wir sind uns bewusst, dass 20:00 Uhr bis 22:00 Uhr eine späte Zeit für Jungbläser ist. Deshalb bieten wir für Jungbläser <strong className="text-brand-primary">dynamische zeitliche Lösungen</strong> an.
                                        </p>
                                        <p className="text-muted-foreground leading-relaxed mt-3">
                                            In Rücksprache finden wir gemeinsam einen Weg, Jungbläser bei uns zu integrieren und darauf achten, dass die Zeiten für alle angemessen sind.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Proben & Mitmachen */}
            <section className="py-24 bg-card">
                <div className="container-app">
                    <div className="max-w-4xl mx-auto text-center px-4">
                        <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
                            Lust mitzumachen?
                        </h2>
                        <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
                            Wir freuen uns immer über neue Gesichter! Ob Anfänger oder erfahrener Musiker – bei uns ist jeder willkommen. Besuche uns bei einer Probe oder kontaktiere uns für weitere Informationen.
                        </p>

                        <div className="grid sm:grid-cols-1 gap-8 max-w-sm mx-auto">
                            <div className="bg-background rounded-3xl p-8 border border-border/10 shadow-sm flex flex-col items-center text-center group hover:shadow-xl transition-all duration-300">
                                <div className="h-16 w-16 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary mb-6 group-hover:scale-110 transition-transform">
                                    <Calendar className="h-8 w-8" />
                                </div>
                                <div className="text-2xl font-black text-foreground mb-1">Jeden 2. Montag</div>
                                <div className="text-lg text-brand-primary font-bold">20:00 – 22:00 Uhr</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

interface FeatureCardProps {
    img: string;
    title: string;
    description: string;
    email1?: string;
    email2?: string;
}

function FeatureCard({ img, title, description, email1, email2 }: FeatureCardProps) {
    return (
        <div className="bg-background rounded-[2rem] border border-border/10 shadow-sm p-6 hover:shadow-xl transition-all duration-300 h-full flex flex-col group text-center">
            <div className="w-24 h-24 rounded-2xl mb-8 overflow-hidden transition-all duration-500 shadow-md mx-auto">
                <img src={img} alt={title} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-4 group-hover:text-brand-primary transition-colors">
                {title}
            </h3>
            <p className="text-muted-foreground leading-relaxed text-base mb-4 flex-grow">
                {description}
            </p>
            {(email1 || email2) && (
                <div className="space-y-3 pt-6 border-t border-border/10">
                    {email1 && (
                        <a
                            href={`mailto:${email1}`}
                            className="flex items-center justify-center gap-4 text-sm font-semibold text-muted-foreground hover:text-brand-primary transition-colors"
                        >
                            <div className="p-2.5 rounded-xl bg-muted/30 text-brand-primary">
                                <Mail className="h-4 w-4" />
                            </div>
                            <span className="truncate">{email1}</span>
                        </a>
                    )}
                </div>
            )}
        </div>
    );
}
