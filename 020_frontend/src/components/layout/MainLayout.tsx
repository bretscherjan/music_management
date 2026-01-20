import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { pushNotificationService } from '@/services/pushNotificationService';

export function MainLayout() {
    // Sync push subscription on mount to ensure backend has the latest endpoint
    useEffect(() => {
        pushNotificationService.syncSubscription().catch(err =>
            console.error('Failed to sync push subscription:', err)
        );
    }, []);

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Header />
            <main className="flex-1 container-app py-8">
                <Outlet />
            </main>
            <footer className="border-t py-6 text-center text-sm text-muted-foreground mt-auto">
                <div className="container-app">
                    © {new Date().getFullYear()} Musig Elgg – Alle Rechte vorbehalten
                </div>
            </footer>
        </div>
    );
}

export default MainLayout;
