import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { CookieBanner } from './CookieBanner';

export function PublicLayout() {
    return (
        <div className="theme-public min-h-screen flex flex-col bg-background">
            <Navbar />
            <main className="flex-1">
                <Outlet />
            </main>
            <Footer />
            <CookieBanner />
        </div>
    );
}
