import { Calendar, Users, Music, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

// Mock news data
const newsItems = [
    {
        id: 1,
        title: 'Sommerkonzert 2026',
        excerpt: 'Wir freuen uns, unser traditionelles Sommerkonzert anzukündigen. Dieses Jahr mit Werken von...',
        date: '2026-01-05',
        image: null,
    },
    {
        id: 2,
        title: 'Neue Mitglieder willkommen',
        excerpt: 'Die Musig Elgg sucht verstärkung! Besonders willkommen sind Klarinetten und Posaunen.',
        date: '2026-01-02',
        image: null,
    },
    {
        id: 3,
        title: 'Jahresrückblick 2025',
        excerpt: 'Ein erfolgreiches Musikjahr liegt hinter uns. Lesen Sie hier die Highlights...',
        date: '2025-12-28',
        image: null,
    },
];

const stats = [
    { icon: Users, value: '45', label: 'Aktive Mitglieder' },
    { icon: Calendar, value: '12', label: 'Auftritte pro Jahr' },
    { icon: Music, value: '128', label: 'Jahre Tradition' },
];

export function Home() {
    return (
        <div>
            {/* Hero Section */}
            <section className="relative bg-gradient-to-br from-primary-800 via-primary-900 to-primary-950 text-white overflow-hidden">
                <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-5"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 relative">
                    <div className="max-w-3xl">
                        <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
                            Willkommen bei der{' '}
                            <span className="text-secondary-400">Musig Elgg</span>
                        </h1>
                        <p className="text-xl text-neutral-200 mb-8 leading-relaxed">
                            Seit 1896 pflegen wir die Blasmusiktradition mit Leidenschaft und Hingabe.
                            Erleben Sie Musik, die verbindet und begeistert.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link
                                to="/events"
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-secondary-500 text-white rounded-lg font-medium hover:bg-secondary-600 transition-colors shadow-lg"
                            >
                                Kommende Anlässe
                                <ArrowRight size={18} />
                            </Link>
                            <Link
                                to="/about"
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/10 text-white rounded-lg font-medium hover:bg-white/20 transition-colors backdrop-blur"
                            >
                                Mehr erfahren
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Decorative Element */}
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-neutral-50 to-transparent"></div>
            </section>

            {/* Stats Section */}
            <section className="py-16 bg-neutral-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {stats.map((stat, index) => {
                            const Icon = stat.icon;
                            return (
                                <div
                                    key={index}
                                    className="bg-white rounded-xl p-6 shadow-card hover:shadow-lg transition-shadow text-center"
                                >
                                    <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary-100 flex items-center justify-center">
                                        <Icon className="text-primary-800" size={28} />
                                    </div>
                                    <div className="text-4xl font-bold text-primary-800 mb-2">{stat.value}</div>
                                    <div className="text-neutral-600">{stat.label}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* News Section */}
            <section className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-3xl font-bold text-primary-800">Aktuelles</h2>
                        <Link
                            to="/news"
                            className="text-primary-800 font-medium hover:text-primary-600 flex items-center gap-1"
                        >
                            Alle News <ArrowRight size={18} />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {newsItems.map((item) => (
                            <article
                                key={item.id}
                                className="bg-neutral-50 rounded-xl overflow-hidden shadow-card hover:shadow-lg transition-all hover:-translate-y-1"
                            >
                                <div className="h-48 bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center">
                                    <Music className="text-primary-300" size={64} />
                                </div>
                                <div className="p-6">
                                    <time className="text-sm text-neutral-500">{new Date(item.date).toLocaleDateString('de-CH')}</time>
                                    <h3 className="text-xl font-bold text-primary-800 mt-2 mb-3">{item.title}</h3>
                                    <p className="text-neutral-600 text-sm line-clamp-3">{item.excerpt}</p>
                                    <Link
                                        to={`/news/${item.id}`}
                                        className="inline-flex items-center gap-1 mt-4 text-secondary-600 font-medium hover:text-secondary-700"
                                    >
                                        Weiterlesen <ArrowRight size={16} />
                                    </Link>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-gradient-to-r from-secondary-500 to-secondary-600">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl font-bold text-white mb-4">Werden Sie Teil unserer Musikfamilie</h2>
                    <p className="text-white/90 mb-8 max-w-2xl mx-auto">
                        Ob erfahrener Musiker oder Neueinsteiger - bei uns sind alle willkommen,
                        die ihre Leidenschaft für Musik teilen möchten.
                    </p>
                    <Link
                        to="/about"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-white text-secondary-600 rounded-lg font-bold hover:bg-neutral-100 transition-colors shadow-lg"
                    >
                        Jetzt Mitglied werden
                        <ArrowRight size={20} />
                    </Link>
                </div>
            </section>
        </div>
    );
}
