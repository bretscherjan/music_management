import { Link } from 'react-router-dom';
import { useDashboardHelper } from './useDashboardHelper';
import { Calendar, Music, CheckSquare, ArrowRight, Bell } from 'lucide-react';
import { format } from 'date-fns';

export function Dashboard() {
    const { user, upcomingEvents, tasks, isLoading } = useDashboardHelper();

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Guten Morgen';
        if (hour < 18) return 'Guten Tag';
        return 'Guten Abend';
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-800"></div>
            </div>
        );
    }

    const nextEvent = upcomingEvents.length > 0 ? upcomingEvents[0] : null;

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Welcome Section */}
            <header className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-800 to-primary-900 text-white p-8 md:p-12 shadow-card">
                <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10"></div>
                <div className="relative z-10">
                    <h1 className="text-3xl md:text-4xl font-bold mb-2">
                        {getGreeting()}, <span className="text-secondary-400">{user?.firstName}</span>
                    </h1>
                    <p className="text-primary-100 text-lg">
                        Willkommen im Mitgliederbereich der Musig Elgg.
                    </p>
                </div>
            </header>

            {/* Quick Links Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* My Events Link */}
                <Link
                    to="/events-member"
                    className="group bg-white p-6 rounded-xl shadow-card hover:shadow-lg transition-all border border-neutral-100 hover:border-secondary-200"
                >
                    <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-lg bg-primary-50 flex items-center justify-center group-hover:bg-primary-100 transition-colors">
                            <Calendar className="text-primary-700" size={24} />
                        </div>
                        <ArrowRight className="text-neutral-300 group-hover:text-primary-700 transition-colors" size={20} />
                    </div>
                    <h3 className="text-xl font-bold text-neutral-800 mb-1">Meine Termine</h3>
                    <p className="text-neutral-500 text-sm">Nächste Proben und Konzerte ansehen</p>
                </Link>

                {/* My Tasks Link */}
                <Link
                    to="/tasks"
                    className="group bg-white p-6 rounded-xl shadow-card hover:shadow-lg transition-all border border-neutral-100 hover:border-secondary-200"
                >
                    <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-lg bg-secondary-50 flex items-center justify-center group-hover:bg-secondary-100 transition-colors">
                            <CheckSquare className="text-secondary-700" size={24} />
                        </div>
                        <div className="flex items-center gap-2">
                            {tasks.length > 0 && (
                                <span className="bg-secondary-100 text-secondary-800 text-xs font-bold px-2 py-1 rounded-full">
                                    {tasks.length} offen
                                </span>
                            )}
                            <ArrowRight className="text-neutral-300 group-hover:text-secondary-700 transition-colors" size={20} />
                        </div>
                    </div>
                    <h3 className="text-xl font-bold text-neutral-800 mb-1">Meine Aufgaben</h3>
                    <p className="text-neutral-500 text-sm">Offene Ämtli und To-Dos erledigen</p>
                </Link>

                {/* Music Library Link */}
                <Link
                    to="/library"
                    className="group bg-white p-6 rounded-xl shadow-card hover:shadow-lg transition-all border border-neutral-100 hover:border-secondary-200"
                >
                    <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-lg bg-neutral-50 flex items-center justify-center group-hover:bg-neutral-100 transition-colors">
                            <Music className="text-neutral-700" size={24} />
                        </div>
                        <ArrowRight className="text-neutral-300 group-hover:text-neutral-700 transition-colors" size={20} />
                    </div>
                    <h3 className="text-xl font-bold text-neutral-800 mb-1">Notenbibliothek</h3>
                    <p className="text-neutral-500 text-sm">Digitale Noten und Vorlagen</p>
                </Link>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Next Event Widget */}
                <div className="bg-white rounded-xl shadow-card border border-neutral-100 overflow-hidden">
                    <div className="p-6 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
                        <h2 className="text-lg font-bold text-primary-900 flex items-center gap-2">
                            <Calendar size={20} className="text-primary-700" />
                            Nächster Termin
                        </h2>
                    </div>

                    {nextEvent ? (
                        <div className="p-6">
                            <div className="flex flex-col md:flex-row gap-6">
                                <div className="flex-shrink-0 flex flex-col items-center justify-center w-20 h-20 bg-primary-50 rounded-xl border border-primary-100 text-primary-900">
                                    <span className="text-xs font-bold uppercase tracking-wider">{format(new Date(nextEvent.startTime), 'MMM')}</span>
                                    <span className="text-3xl font-bold leading-none">{format(new Date(nextEvent.startTime), 'dd')}</span>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-neutral-900 mb-2">{nextEvent.title}</h3>
                                    <div className="space-y-1 text-neutral-600 text-sm">
                                        <p className="flex items-center gap-2">
                                            <span className="w-20 text-neutral-400">Zeit:</span>
                                            {format(new Date(nextEvent.startTime), 'HH:mm')} Uhr
                                        </p>
                                        <p className="flex items-center gap-2">
                                            <span className="w-20 text-neutral-400">Ort:</span>
                                            {nextEvent.location || 'Kein Ort angegeben'}
                                        </p>
                                    </div>
                                    <Link
                                        to={`/events/${nextEvent.id}`}
                                        className="inline-flex items-center gap-1 text-sm font-bold text-primary-700 hover:text-primary-800 mt-4"
                                    >
                                        Details ansehen <ArrowRight size={16} />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-8 text-center text-neutral-500">
                            Keine anstehenden Termine in den nächsten Tagen.
                        </div>
                    )}
                </div>

                {/* Announcements / Tasks Widget */}
                <div className="bg-white rounded-xl shadow-card border border-neutral-100">
                    <div className="p-6 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
                        <h2 className="text-lg font-bold text-primary-900 flex items-center gap-2">
                            <Bell size={20} className="text-secondary-600" />
                            Neuigkeiten
                        </h2>
                    </div>
                    <div className="p-6 space-y-4">
                        {/* Placeholder for "New Survey" */}
                        <div className="flex gap-4 p-4 rounded-lg bg-neutral-50 border border-neutral-100">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-secondary-100 flex items-center justify-center text-secondary-700 font-bold">
                                !
                            </div>
                            <div>
                                <h4 className="font-bold text-neutral-900">Generalversammlung 2026</h4>
                                <p className="text-sm text-neutral-600 mb-2">Die Traktandenliste ist jetzt online verfügbar.</p>
                                <Link to="/surveys" className="text-xs font-bold text-secondary-700 hover:underline">
                                    Zur Abstimmung →
                                </Link>
                            </div>
                        </div>

                        {/* Recent Tasks */}
                        <div className="flex gap-4 p-4 rounded-lg bg-neutral-50 border border-neutral-100">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-primary-700">
                                <CheckSquare size={18} />
                            </div>
                            <div>
                                <h4 className="font-bold text-neutral-900">Offene Aufgaben</h4>
                                <p className="text-sm text-neutral-600 mb-2">Du hast 2 offene Aufgaben für den nächsten Anlass.</p>
                                <Link to="/tasks" className="text-xs font-bold text-primary-700 hover:underline">
                                    Ansehen →
                                </Link>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
