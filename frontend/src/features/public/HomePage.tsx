import { ArrowRight, Calendar, Music, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const HomePage = () => {
    return (
        <div className="animate-fade-in-up">
            {/* Hero Section */}
            <section className="relative h-[80vh] flex items-center justify-center bg-charcoal overflow-hidden">
                {/* Background Image Placeholder (Replace with real image later) */}
                <div className="absolute inset-0 bg-gradient-to-r from-charcoal/90 to-charcoal/60 z-10"></div>
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-50"
                    style={{ backgroundImage: "url('https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=2664&auto=format&fit=crop')" }}
                ></div>

                {/* Hero Content */}
                <div className="container mx-auto px-4 z-20 text-center text-white">
                    <h1 className="font-heading text-5xl md:text-7xl font-bold mb-6 drop-shadow-xl">
                        Musig <span className="text-secondary">Elgg</span>
                    </h1>
                    <p className="text-xl md:text-2xl mb-10 text-gray-200 max-w-2xl mx-auto font-light">
                        Leidenschaft, Tradition und Gemeinschaft. Erleben Sie Blasmusik neu interpretiert.
                    </p>
                    <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6 justify-center">
                        <Link
                            to="/agenda"
                            className="bg-primary hover:bg-red-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center space-x-2"
                        >
                            <span>Nächste Auftritte</span>
                            <ArrowRight size={20} />
                        </Link>
                        <Link
                            to="/about"
                            className="bg-transparent border-2 border-white hover:bg-white hover:text-charcoal text-white font-bold py-3 px-8 rounded-full transition-all duration-300"
                        >
                            Über Uns
                        </Link>
                    </div>
                </div>

                {/* Scroll Indicator */}
                <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce text-white/50">
                    <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center pt-2">
                        <div className="w-1 h-3 bg-white/50 rounded-full"></div>
                    </div>
                </div>
            </section>

            {/* Features / Intro */}
            <section className="py-20 bg-white">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="font-heading text-4xl font-bold text-charcoal mb-16 relative inline-block">
                        Unser Verein
                        <span className="absolute -bottom-4 left-0 w-full h-1 bg-secondary rounded-full"></span>
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        <FeatureCard
                            icon={<Music size={40} className="text-white" />}
                            title="Repertoire"
                            description="Von klassischer Blasmusik bis hin zu modernen Pop- und Rock-Arrangements. Unser Repertoire ist so vielfältig wie wir."
                        />
                        <FeatureCard
                            icon={<Users size={40} className="text-white" />}
                            title="Gemeinschaft"
                            description="Musik verbindet. Ob Jung oder Alt, bei uns steht der Zusammenhalt und die Freude am gemeinsamen Musizieren im Vordergrund."
                        />
                        <FeatureCard
                            icon={<Calendar size={40} className="text-white" />}
                            title="Events"
                            description="Jahreskonzerte, Dorffeste und Ständchen. Wir sind ein aktiver Teil des Elgger Kulturlebens und freuen uns auf Ihren Besuch."
                        />
                    </div>
                </div>
            </section>

            {/* Upcoming Events Preview (Mock Data) */}
            <section className="py-20 bg-paper">
                <div className="container mx-auto px-4">
                    <div className="flex justify-between items-end mb-12">
                        <div>
                            <h2 className="font-heading text-3xl font-bold text-charcoal mb-2">Nächste Termine</h2>
                            <p className="text-gray-600">Seien Sie live dabei!</p>
                        </div>
                        <Link to="/agenda" className="text-primary font-bold hover:text-secondary transition-colors flex items-center space-x-1">
                            <span>Alle Termine</span>
                            <ArrowRight size={18} />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Event Card 1 */}
                        <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 border border-gray-100">
                            <div className="bg-primary h-2 w-full"></div>
                            <div className="p-6">
                                <div className="text-secondary font-bold text-sm mb-2 uppercase tracking-wide">15. Mai 2026</div>
                                <h3 className="font-heading text-xl font-bold text-charcoal mb-2">Frühlingskonzert</h3>
                                <p className="text-gray-600 mb-4 line-clamp-2">Starten Sie mit uns musikalisch in den Frühling. Ein bunter Strauss an Melodien erwartet Sie im Werkgebäude.</p>
                                <div className="flex items-center text-gray-500 text-sm">
                                    <Calendar size={16} className="mr-2" />
                                    <span>20:00 Uhr</span>
                                </div>
                            </div>
                        </div>

                        {/* Event Card 2 */}
                        <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 border border-gray-100">
                            <div className="bg-primary h-2 w-full"></div>
                            <div className="p-6">
                                <div className="text-secondary font-bold text-sm mb-2 uppercase tracking-wide">01. August 2026</div>
                                <h3 className="font-heading text-xl font-bold text-charcoal mb-2">Bundesfeier</h3>
                                <p className="text-gray-600 mb-4 line-clamp-2">Traditionelle Umrahmung der 1. August-Feier auf dem Lindenplatz. Festwirtschaft und Musik.</p>
                                <div className="flex items-center text-gray-500 text-sm">
                                    <Calendar size={16} className="mr-2" />
                                    <span>10:30 Uhr</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
    <div className="flex flex-col items-center">
        <div className="w-20 h-20 bg-primary rounded-2xl rotate-3 flex items-center justify-center shadow-lg mb-6 transform transition-transform hover:rotate-6 hover:scale-105">
            <div className="-rotate-3">
                {icon}
            </div>
        </div>
        <h3 className="font-heading text-xl font-bold text-charcoal mb-3">{title}</h3>
        <p className="text-gray-600 leading-relaxed max-w-xs">{description}</p>
    </div>
);

export default HomePage;
