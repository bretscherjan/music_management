import { Users, Music2, Calendar, Award } from 'lucide-react';

export function AboutPage() {
    return (
        <div>
            {/* Hero Section */}
            <section className="bg-gradient-to-br from-[hsl(var(--musig-burgundy))] to-[hsl(var(--musig-burgundy))]/80 text-white py-20">
                <div className="container-app">
                    <div className="max-w-3xl mx-auto text-center">
                        <h1 className="text-5xl font-bold mb-6">Über uns</h1>
                        <p className="text-xl text-white/90 leading-relaxed">
                            Die Musig Elgg – ein Verein mit Tradition, Leidenschaft und Gemeinschaft
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
                                    Unsere Geschichte
                                </h2>
                                <div className="space-y-4 text-[hsl(var(--muted-foreground))] leading-relaxed">
                                    <p>
                                        Seit der Gründung im Jahr <strong className="text-[hsl(var(--musig-burgundy))]">1896</strong> ist
                                        die Musig Elgg ein fester Bestandteil des kulturellen Lebens in Elgg und Umgebung.
                                    </p>
                                    <p>
                                        Über 125 Jahre Tradition und musikalische Exzellenz prägen unseren Verein.
                                        Wir pflegen die Blasmusiktradition und setzen gleichzeitig auf moderne Interpretationen
                                        und zeitgenössisches Repertoire.
                                    </p>
                                    <p>
                                        Von festlichen Anlässen über Konzerte bis hin zu geselligen Zusammenkünften –
                                        die Musig Elgg ist aus dem Dorfleben nicht wegzudenken.
                                    </p>
                                </div>
                            </div>
                            <div className="bg-gradient-to-br from-[hsl(var(--musig-gold))]/20 to-[hsl(var(--musig-burgundy))]/20 rounded-2xl p-8 border-2 border-[hsl(var(--musig-gold))]/30">
                                <div className="text-center">
                                    <div className="text-6xl font-bold text-[hsl(var(--musig-burgundy))] mb-2">
                                        125+
                                    </div>
                                    <div className="text-xl text-[hsl(var(--muted-foreground))]">
                                        Jahre Tradition
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Features */}
                        <div className="grid md:grid-cols-3 gap-8">
                            <FeatureCard
                                icon={<Music2 className="h-8 w-8" />}
                                title="Vielfältiges Repertoire"
                                description="Von traditioneller Blasmusik über Märsche bis hin zu modernen Arrangements."
                            />
                            <FeatureCard
                                icon={<Users className="h-8 w-8" />}
                                title="Starke Gemeinschaft"
                                description="Über 40 aktive Musikerinnen und Musiker jeden Alters bilden unsere Familie."
                            />
                            <FeatureCard
                                icon={<Calendar className="h-8 w-8" />}
                                title="Regelmäßige Auftritte"
                                description="Konzerte, Dorffeste, Umzüge und besondere Anlässe prägen unser Jahr."
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Unsere Werte */}
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
                                        Jeden Montag
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
    icon: React.ReactNode;
    title: string;
    description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
    return (
        <div className="bg-white rounded-xl border border-[hsl(var(--border))] p-6 hover:shadow-lg transition-shadow">
            <div className="bg-gradient-to-br from-[hsl(var(--musig-burgundy))] to-[hsl(var(--musig-burgundy))]/80 text-white w-14 h-14 rounded-full flex items-center justify-center mb-4">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-[hsl(var(--musig-burgundy))] mb-2">
                {title}
            </h3>
            <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">
                {description}
            </p>
        </div>
    );
}

interface ValueCardProps {
    title: string;
    description: string;
}

function ValueCard({ title, description }: ValueCardProps) {
    return (
        <div className="bg-white rounded-xl border-l-4 border-[hsl(var(--musig-gold))] p-6 shadow-sm">
            <h3 className="text-xl font-bold text-[hsl(var(--musig-burgundy))] mb-2">
                {title}
            </h3>
            <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">
                {description}
            </p>
        </div>
    );
}
