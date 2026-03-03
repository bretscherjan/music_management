import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { CookieBanner } from './CookieBanner';

export function PublicLayout() {
    return (
        <div className="min-h-screen flex flex-col bg-[hsl(var(--background))]">
            <Navbar />
            <main className="flex-1">
                <Outlet />
            </main>
            <Footer />
            <CookieBanner />
        </div>
    );
}
