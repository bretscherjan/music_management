import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import { Sidebar } from './Sidebar';
import MobileBottomNav from './MobileBottomNav';
import { pushNotificationService } from '@/services/pushNotificationService';

export function MainLayout() {
    // Sync push subscription on mount to ensure backend has the latest endpoint
    useEffect(() => {
        pushNotificationService.syncSubscription().catch(err =>
            console.error('Failed to sync push subscription:', err)
        );
    }, []);

    return (
        <div className="theme-member min-h-screen flex flex-col bg-background">
            <Header />
            {/* Full width flex container for Sidebar + Content */}
            <div className="flex-1 flex">
                <Sidebar />
                {/* Content Area - takes remaining width */}
                <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
                    <main className="flex-1 container-app py-4 md:py-8 w-full pb-20 md:pb-8">
                        <Outlet />
                    </main>
                    <footer className="border-t py-6 text-center text-sm text-muted-foreground mt-auto hidden md:block">
                        <div className="container-app">
                            © {new Date().getFullYear()} Musig Elgg – Alle Rechte vorbehalten
                        </div>
                    </footer>
                </div>
            </div>
            <MobileBottomNav />
        </div>
    );
}

export default MainLayout;
