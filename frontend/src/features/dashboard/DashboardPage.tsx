import { useAuth } from '../../contexts/AuthContext';
import { Calendar, CheckCircle, Clock, AlertCircle, FileText, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const DashboardPage = () => {
    const { user } = useAuth();
    const isBoard = user?.roles?.includes('Board') || user?.roles?.includes('Admin');

    return (
        <div className="animate-fade-in-up space-y-8">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-charcoal">
                        Hallo, {user?.firstName} 👋
                    </h1>
                    <p className="text-gray-500 mt-1">Hier ist der Überblick über deine Aktivitäten.</p>
                </div>
                <div className="hidden md:block text-sm text-gray-400 text-right">
                    {new Date().toLocaleDateString('de-CH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </header>

            {/* Quick Stats / Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatusCard
                    icon={<Calendar className="text-primary" size={24} />}
                    label="Nächste Probe"
                    value="Do, 20.01."
                    subtext="20:00 Uhr, Probelokal"
                />
                <StatusCard
                    icon={<CheckCircle className="text-green-600" size={24} />}
                    label="Anwesenheit"
                    value="92%"
                    subtext="Letzte 12 Monate"
                />
                <StatusCard
                    icon={<Clock className="text-secondary" size={24} />}
                    label="Offene Rückmeldungen"
                    value="2"
                    subtext="Bitte erledigen"
                    alert
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Column: Next Events */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold font-heading text-charcoal">Nächste Termine</h2>
                            <Link to="/internal/events" className="text-primary text-sm font-bold hover:underline">Alle anzeigen</Link>
                        </div>
                        <div className="space-y-4">
                            <EventListItem
                                date="20. Jan"
                                title="Gesamtprobe"
                                time="20:00 - 22:00"
                                location="Probelokal"
                                status="pending"
                            />
                            <EventListItem
                                date="27. Jan"
                                title="Gesamtprobe"
                                time="20:00 - 22:00"
                                location="Probelokal"
                                status="attending"
                            />
                            <EventListItem
                                date="03. Feb"
                                title="Hauptversammlung"
                                time="19:30 - 22:00"
                                location="Rössli Elgg"
                                status="declined"
                            />
                        </div>
                    </div>

                    {/* Polls or Messages could go here */}
                </div>

                {/* Right Column: Widgets */}
                <div className="space-y-6">
                    {/* Board Widget (Only visible to Board) */}
                    {isBoard && (
                        <div className="bg-white rounded-xl shadow-sm border-l-4 border-secondary p-6">
                            <h3 className="text-lg font-bold font-heading text-charcoal mb-4 flex items-center">
                                <AlertCircle size={20} className="mr-2 text-secondary" />
                                Vorstand Aufgaben
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer">
                                    <span className="text-sm font-medium">Rollen-Anträge</span>
                                    <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded-full">1 Neu</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer">
                                    <span className="text-sm font-medium">Inventarleihen</span>
                                    <span className="bg-gray-200 text-gray-600 text-xs font-bold px-2 py-1 rounded-full">0</span>
                                </div>
                            </div>
                            <Link to="/internal/governance" className="block mt-4 text-center text-sm text-secondary font-bold hover:text-charcoal transition">
                                Zum Vorstands-Bereich
                            </Link>
                        </div>
                    )}

                    {/* Quick Links */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-bold font-heading text-charcoal mb-4">Schnellzugriff</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <QuickLink icon={<FileText size={18} />} label="Setlisten" />
                            <QuickLink icon={<Users size={18} />} label="Mitglieder" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Sub-Components
const StatusCard = ({ icon, label, value, subtext, alert = false }: any) => (
    <div className={`bg-white p-6 rounded-xl shadow-sm border ${alert ? 'border-red-200 bg-red-50/30' : 'border-gray-100'}`}>
        <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-gray-50 rounded-lg">{icon}</div>
            <span className="text-gray-500 text-sm font-medium">{label}</span>
        </div>
        <div className="text-2xl font-bold text-charcoal">{value}</div>
        <div className={`text-xs mt-1 ${alert ? 'text-red-600 font-bold' : 'text-gray-400'}`}>{subtext}</div>
    </div>
);

const EventListItem = ({ date, title, time, location, status }: any) => {
    let statusColor = "bg-gray-100 text-gray-500";
    let statusText = "Offen";
    if (status === 'attending') { statusColor = "bg-green-100 text-green-700"; statusText = "Zugesagt"; }
    if (status === 'declined') { statusColor = "bg-red-100 text-red-700"; statusText = "Abgesagt"; }

    return (
        <div className="flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100">
            <div className="w-16 text-center border-r border-gray-100 pr-4 mr-4">
                <div className="text-sm font-bold text-charcoal">{date}</div>
            </div>
            <div className="flex-1">
                <h4 className="font-bold text-charcoal text-sm">{title}</h4>
                <div className="text-xs text-gray-500 flex items-center mt-1">
                    <Clock size={12} className="mr-1" /> {time}
                    <span className="mx-2">•</span>
                    {location}
                </div>
            </div>
            <div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${statusColor}`}>{statusText}</span>
            </div>
        </div>
    );
}

const QuickLink = ({ icon, label }: any) => (
    <button className="flex flex-col items-center justify-center p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition text-gray-600 hover:text-primary">
        {icon}
        <span className="text-xs font-bold mt-2">{label}</span>
    </button>
)

export default DashboardPage;
