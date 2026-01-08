import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';

// Map routes to page titles
const pageTitles: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/events-member': 'Anlässe',
    '/library': 'Notenbibliothek',
    '/tasks': 'Aufgaben',
    '/members': 'Mitglieder',
    '/settings': 'Einstellungen',
};

export function MainLayout() {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const location = useLocation();

    const currentTitle = pageTitles[location.pathname] || 'Musig Elgg';

    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    return (
        <div className="min-h-screen bg-neutral-50">
            {/* Sidebar */}
            <Sidebar
                isCollapsed={isSidebarCollapsed}
                onToggle={toggleSidebar}
            />

            {/* Header */}
            <Header
                title={currentTitle}
                onMenuClick={toggleSidebar}
                isSidebarCollapsed={isSidebarCollapsed}
            />

            {/* Main Content */}
            <main
                className={`
          pt-16 min-h-screen transition-all duration-300
          ${isSidebarCollapsed ? 'ml-20' : 'ml-64'}
        `}
            >
                <div className="p-6">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
