import { Outlet } from 'react-router-dom';
import { Header } from './Header';

export function MainLayout() {
    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Header />
            <main className="flex-1 container-app py-6">
                <Outlet />
            </main>
            <footer className="border-t py-4 text-center text-sm text-muted-foreground">
                <div className="container-app">
                    © {new Date().getFullYear()} Musig Elgg – Alle Rechte vorbehalten
                </div>
            </footer>
        </div>
    );
}

export default MainLayout;
