import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Calendar,
    FileText,
    Users,
    LogOut,
    Menu,
    X,
    UserCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const InternalLayout = () => {
    const { user, logout } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
    const location = useLocation();

    const isActive = (path: string) => location.pathname.includes(path);

    const navItems = [
        { path: '/internal/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
        { path: '/internal/events', icon: <Calendar size={20} />, label: 'Termine' },
        { path: '/internal/documents', icon: <FileText size={20} />, label: 'Dokumente' },
        { path: '/internal/profile', icon: <UserCircle size={20} />, label: 'Mein Profil' },
    ];

    // Board only items - In real app, check role
    if (user?.roles?.includes('Board') || user?.roles?.includes('Admin')) {
        navItems.splice(3, 0, { path: '/internal/governance', icon: <Users size={20} />, label: 'Vorstand' });
    }

    return (
        <div className="flex h-screen bg-gray-100 font-body">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col w-64 bg-charcoal text-white transition-all duration-300">
                <div className="p-6 flex items-center space-x-3 border-b border-gray-700">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-secondary font-bold font-heading">ME</div>
                    <span className="font-heading font-bold text-lg tracking-wide">Interner Bereich</span>
                </div>

                <nav className="flex-1 py-6 px-3 space-y-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive(item.path) ? 'bg-primary text-white font-bold' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-700">
                    <div className="flex items-center space-x-3 mb-4 px-2">
                        <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-xl text-white font-bold">
                            {user?.firstName?.charAt(0) ?? 'U'}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold truncate">{user?.firstName} {user?.lastName}</p>
                            <p className="text-xs text-gray-400 truncate">{user?.roles?.join(', ')}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="flex items-center space-x-2 w-full px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <LogOut size={18} />
                        <span>Abmelden</span>
                    </button>
                </div>
            </aside>

            {/* Mobile Header & Overlay */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="md:hidden bg-white shadow-sm flex items-center justify-between p-4 z-20">
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-secondary font-bold font-heading">ME</div>
                        <span className="font-heading font-bold text-charcoal">Intern</span>
                    </div>
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-charcoal p-1">
                        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </header>

                {/* Mobile Navigation Drawer */}
                {isSidebarOpen && (
                    <div className="md:hidden fixed inset-0 z-10 bg-gray-900/50 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}>
                        <div className="absolute right-0 top-0 h-full w-64 bg-white shadow-xl p-4 flex flex-col" onClick={e => e.stopPropagation()}>
                            <div className="mt-14 space-y-2 flex-1">
                                {navItems.map((item) => (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        onClick={() => setIsSidebarOpen(false)}
                                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg ${isActive(item.path) ? 'bg-primary/10 text-primary font-bold' : 'text-gray-600'}`}
                                    >
                                        {item.icon}
                                        <span>{item.label}</span>
                                    </Link>
                                ))}
                            </div>
                            <div className="border-t pt-4">
                                <button
                                    onClick={logout}
                                    className="flex items-center space-x-3 px-4 py-3 w-full text-red-600 font-medium"
                                >
                                    <LogOut size={20} />
                                    <span>Abmelden</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Content Area */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-paper p-4 md:p-8">
                    <Outlet />
                </main>

                <div className="md:hidden bg-white border-t border-gray-200 flex justify-around p-2 pb-safe">
                    <Link to="/internal/dashboard" className={`flex flex-col items-center p-2 ${isActive('/internal/dashboard') ? 'text-primary' : 'text-gray-400'}`}>
                        <LayoutDashboard size={24} />
                        <span className="text-[10px] mt-1">Home</span>
                    </Link>
                    <Link to="/internal/events" className={`flex flex-col items-center p-2 ${isActive('/internal/events') ? 'text-primary' : 'text-gray-400'}`}>
                        <Calendar size={24} />
                        <span className="text-[10px] mt-1">Termine</span>
                    </Link>
                    <Link to="/internal/profile" className={`flex flex-col items-center p-2 ${isActive('/internal/profile') ? 'text-primary' : 'text-gray-400'}`}>
                        <UserCircle size={24} />
                        <span className="text-[10px] mt-1">Profil</span>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default InternalLayout;
