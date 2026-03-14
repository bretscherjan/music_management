import { Calendar, Mail } from 'lucide-react';
import praesidentinImg from '../../img/praesidentin1.jpeg';
import kassierImg from '../../img/kassier.jpeg';
import aktuarImg from '../../img/aktuar.jpg';

export function AboutPage() {
    return (
        <div>
            {/* Hero Section */}
            <section className="bg-gradient-to-br from-brand-primary to-brand-primary/80 text-white py-20">
                <div className="container-app">
                    <div className="max-w-3xl mx-auto text-center">
                        <h1 className="text-5xl font-bold mb-6">Über uns</h1>
                        <p className="text-xl text-white/90 leading-relaxed">
                            Die Musig Elgg – eine kürzlich gegründete Musig mit Engagement und Begeisterung
                        </p>
                    </div>
                </div>
            </section>

            {/* Geschichte */}
            <section className="py-16">
                <div className="container-app">
                    <div className="max-w-4xl mx-auto">
                        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
                            <div>
                                <h2 className="text-3xl font-bold text-brand-primary mb-6">
                                    Gründung
                                </h2>
                                <div className="space-y-4 text-muted-foreground leading-relaxed">
                                    <p>
                                        Die Musig Elgg wurde im Jahr <strong className="text-brand-primary">2026</strong> gegründet.
                                    </p>
                                    <p>
                                        Wir sind eine junge Musig mit Engagement und Begeisterung.
                                    </p>
                                    <p>
                                        Aktuell zählen wir etwa 20 Mitspieler*innen <strong className="text-brand-primary">jeder Altersklasse</strong>, die regelmässig gemeinsam musizieren und für Auftritte und Ständchen Proben.
                                    </p>
                                </div>
                            </div>
                            <div className="bg-brand-primary/7.5 rounded-2xl p-8 border-2 border-brand-secondary/30">
                                <div className="text-center">
                                    <div className="text-6xl font-bold text-brand-primary mb-2">
                                        22
                                    </div>
                                    <div className="text-xl text-muted-foreground">
                                        Mitspieler*innen
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Features */}
                        <div className="grid md:grid-cols-3 gap-8">
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

            {/* Unsere Werte 
            <section className="py-16 bg-gradient-to-r from-brand-primary/5 to-brand-secondary/5">
                <div className="container-app">
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-3xl font-bold text-brand-primary mb-8 text-center">
                            Unsere Werte
                        </h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            <ValueCard
                                title="Tradition"
                                description="Wir pflegen und ehren die über 125-jährige Geschichte der Blasmusik in Elgg."
                            />
                            <ValueCard
                                title="Qualität"
                                description="Durch regelmäßige Proben und Weiterbildungen streben wir nach musikalischer Exzellenz."
                            />
                            <ValueCard
                                title="Gemeinschaft"
                                description="Der Zusammenhalt und die Freundschaft innerhalb des Vereins sind uns wichtig."
                                />
                            <ValueCard
                                title="Innovation"
                                description="Wir sind offen für neue musikalische Wege und zeitgemäße Interpretationen."
                            />
                        </div>
                    </div>
                </div>
            </section>
            */}

            {/* Jungbläser & Ausbildung */}
            <section className="py-16 bg-brand-primary/7.5">
                <div className="container-app">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="text-3xl font-bold text-brand-primary mb-4">
                            Jungbläser
                        </h2>
                        <p className="text-lg text-muted-foreground mb-8 leading-relaxed max-w-2xl mx-auto">
                            Musik verbindet Generationen – wir möchten gerne mit Musikanntinnen und Musikanten jeder Alterstufe zusammenarbeiten, deshalb freuen wir uns über jeden Jungbläser bei uns.
                        </p>
                        <div className="bg-white rounded-xl border border-[hsl(var(--border))] shadow-sm p-8 inline-block w-full max-w-3xl">
                            <h3 className="text-xl font-bold text-foreground mb-4">
                                Flexibilität für den Nachwuchs
                            </h3>
                            <p className="text-muted-foreground leading-relaxed text-lg">
                                Wir sind uns bewusst, dass 20:00 Uhr bis 22:00 Uhr eine späte Zeit für Jungbläser ist. Deshalb bieten wir für Jungbläser
                                <strong className="text-brand-primary"> dynamische zeitliche Lösungen</strong> an.
                                <br />
                                In Rücksprache finden wir gemeinsam einen Weg, Jungbläser bei uns zu integrieren und darauf achten, dass die Zeiten für alle angemessen sind.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Proben & Mitmachen */}
            <section className="py-16">
                <div className="container-app">
                    <div className="max-w-3xl mx-auto text-center">
                        <h2 className="text-3xl font-bold text-brand-primary mb-4">
                            Lust mitzumachen?
                        </h2>
                        <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                            Wir freuen uns immer über neue Gesichter! Ob Anfänger oder erfahrener Musiker –
                            bei uns ist jeder willkommen. Besuche uns bei einer Probe oder kontaktiere uns
                            für weitere Informationen.
                        </p>
                        <div className="bg-white rounded-xl border border-[hsl(var(--border))] shadow-sm p-8 inline-block">
                            <div className="flex items-center gap-4">
                                <Calendar className="h-12 w-12 text-brand-secondary" />
                                <div className="text-left">
                                    <div className="text-sm text-muted-foreground">Proben</div>
                                    <div className="text-2xl font-bold text-brand-primary">
                                        Jeden 2. Montag
                                    </div>
                                    <div className="text-lg text-muted-foreground">
                                        20:00 Uhr
                                    </div>
                                </div>
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
        <div className="bg-white rounded-xl border border-[hsl(var(--border))] shadow-sm p-6 hover:shadow-md transition-shadow h-full flex flex-col">
            <div className="bg-gradient-to-br from-brand-primary to-brand-primary/80 text-white w-14 h-14 rounded-full flex items-center justify-center mb-4 overflow-hidden shrink-0">
                <img src={img} alt={title} className="w-full h-full object-cover" />
            </div>
            <h3 className="text-xl font-bold text-brand-primary mb-2">
                {title}
            </h3>
            <p className="text-muted-foreground leading-relaxed mb-6 flex-grow">
                {description}
            </p>
            {(email1 || email2) && (
                <div className="flex flex-col gap-3 pt-4 border-t border-[hsl(var(--border))] mt-auto">
                    {email1 && (
                        <a
                            href={`mailto:${email1}`}
                            className="flex items-center gap-3 text-sm text-muted-foreground hover:text-brand-secondary transition-colors group"
                        >
                            <div className="p-2 rounded-full bg-brand-primary/10 text-brand-primary group-hover:bg-brand-secondary/10 group-hover:text-brand-secondary transition-colors shrink-0">
                                <Mail className="h-4 w-4" />
                            </div>
                            <span className="truncate">{email1}</span>
                        </a>
                    )}
                    {email2 && (
                        <a
                            href={`mailto:${email2}`}
                            className="flex items-center gap-3 text-sm text-muted-foreground hover:text-brand-secondary transition-colors group"
                        >
                            <div className="p-2 rounded-full bg-brand-primary/10 text-brand-primary group-hover:bg-brand-secondary/10 group-hover:text-brand-secondary transition-colors shrink-0">
                                <Mail className="h-4 w-4" />
                            </div>
                            <span className="truncate">{email2}</span>
                        </a>
                    )}
                </div>
            )}
        </div>
    );
}
