import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { pushNotificationService } from '@/services/pushNotificationService';

export function MainLayout() {
    // Sync push subscription on mount to ensure backend has the latest endpoint
    useEffect(() => {
        pushNotificationService.syncSubscription().catch(err =>
            console.error('Failed to sync push subscription:', err)
        );
    }, []);

    return (
        <div className="theme-member bg-background md:min-h-screen">
            <Header />
            <div className="flex flex-col h-[100dvh] md:h-auto pt-[calc(var(--header-height)+env(safe-area-inset-top,0px))]">
                {/* Full width flex container for Sidebar + Content */}
                <div className="flex-1 flex min-h-0">
                    <Sidebar />
                    {/* Content Area - takes remaining width */}
                    <div className="flex-1 flex flex-col min-w-0 overflow-hidden md:overflow-visible">
                        <main className="flex-1 min-h-0 overflow-y-auto md:overflow-visible">
                            <div className="container-app pt-4 md:pt-8 pb-4 md:pb-8 w-full">
                                <Outlet />
                            </div>
                        </main>
                        <footer className="border-t py-6 text-center text-sm text-muted-foreground mt-auto hidden md:block">
                            <div className="container-app">
                                © {new Date().getFullYear()} Musig Elgg – Alle Rechte vorbehalten
                            </div>
                        </footer>
                    </div>
                </div>
            </div>
            <BottomNav />
        </div>
    );
}

export default MainLayout;
