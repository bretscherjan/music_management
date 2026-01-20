import { Calendar, Award } from 'lucide-react';

export function AboutPage() {
    return (
        <div>
            {/* Hero Section */}
            <section className="bg-gradient-to-br from-[hsl(var(--musig-burgundy))] to-[hsl(var(--musig-burgundy))]/80 text-white py-20">
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
                                <h2 className="text-3xl font-bold text-[hsl(var(--musig-burgundy))] mb-6">
                                    Gründung
                                </h2>
                                <div className="space-y-4 text-[hsl(var(--muted-foreground))] leading-relaxed">
                                    <p>
                                        Die Musig Elgg wurde im Jahr <strong className="text-[hsl(var(--musig-burgundy))]">2026</strong> gegründet.
                                    </p>
                                    <p>
                                        Wir sind eine junge Musig mit Engagement und Begeisterung.
                                    </p>
                                    <p>
                                        Aktuell zählen wir etwa 20 Mitspieler*innen <strong className="text-[hsl(var(--musig-burgundy))]">jeder Altersklasse</strong>, die regelmässig gemeinsam musizieren und für Auftritte und Ständchen Proben.
                                    </p>
                                </div>
                            </div>
                            <div className="bg-gradient-to-br from-[hsl(var(--musig-gold))]/20 to-[hsl(var(--musig-burgundy))]/20 rounded-2xl p-8 border-2 border-[hsl(var(--musig-gold))]/30">
                                <div className="text-center">
                                    <div className="text-6xl font-bold text-[hsl(var(--musig-burgundy))] mb-2">
                                        20
                                    </div>
                                    <div className="text-xl text-[hsl(var(--muted-foreground))]">
                                        Mitspieler*innen
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Features */}
                        <div className="grid md:grid-cols-3 gap-8">
                            <FeatureCard
                                img="/images/praesident.png"
                                title="Präsidentin"
                                description="Ramona Egli"
                                email="praesident@musig-elgg.ch"
                            />
                            <FeatureCard
                                img="/images/dirigent.png"
                                title="Kassier/Dirigent"
                                description="Christian Meier"
                                email="kassier@musig-elgg.ch"
                            />
                            <FeatureCard
                                img="../../public/aktuar.jpg"
                                title="Aktuar"
                                description="Jan Bretscher"
                                email="aktuar@musig-elgg.ch"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Unsere Werte 
            <section className="py-16 bg-gradient-to-r from-[hsl(var(--musig-burgundy))]/5 to-[hsl(var(--musig-gold))]/5">
                <div className="container-app">
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-3xl font-bold text-[hsl(var(--musig-burgundy))] mb-8 text-center">
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

            {/* Proben & Mitmachen */}
            <section className="py-16">
                <div className="container-app">
                    <div className="max-w-3xl mx-auto text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-[hsl(var(--musig-burgundy))] text-white rounded-full mb-6">
                            <Award className="h-8 w-8" />
                        </div>
                        <h2 className="text-3xl font-bold text-[hsl(var(--musig-burgundy))] mb-4">
                            Lust mitzumachen?
                        </h2>
                        <p className="text-lg text-[hsl(var(--muted-foreground))] mb-8 leading-relaxed">
                            Wir freuen uns immer über neue Gesichter! Ob Anfänger oder erfahrener Musiker –
                            bei uns ist jeder willkommen. Besuchen Sie uns bei einer Probe oder kontaktieren Sie uns
                            für weitere Informationen.
                        </p>
                        <div className="bg-white rounded-xl border border-[hsl(var(--border))] p-8 inline-block">
                            <div className="flex items-center gap-4">
                                <Calendar className="h-12 w-12 text-[hsl(var(--musig-gold))]" />
                                <div className="text-left">
                                    <div className="text-sm text-[hsl(var(--muted-foreground))]">Proben</div>
                                    <div className="text-2xl font-bold text-[hsl(var(--musig-burgundy))]">
                                        Jeden 2. Montag
                                    </div>
                                    <div className="text-lg text-[hsl(var(--muted-foreground))]">
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
    email?: string;
}

function FeatureCard({ img, title, description, email }: FeatureCardProps) {
    return (
        <div className="bg-white rounded-xl border border-[hsl(var(--border))] p-6 hover:shadow-lg transition-shadow">
            <div className="bg-gradient-to-br from-[hsl(var(--musig-burgundy))] to-[hsl(var(--musig-burgundy))]/80 text-white w-14 h-14 rounded-full flex items-center justify-center mb-4 overflow-hidden">
                <img src={img} alt={title} className="w-full h-full object-cover" />
            </div>
            <h3 className="text-xl font-bold text-[hsl(var(--musig-burgundy))] mb-2">
                {title}
            </h3>
            <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">
                {description}
            </p>
            {email && (
                <a href={`mailto:${email}`} className="hover:text-[hsl(var(--musig-gold))] hover:underline">
                    {email}
                </a>
            )}
        </div>
    );
}
