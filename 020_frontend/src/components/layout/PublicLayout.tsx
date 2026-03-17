import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { CookieBanner } from './CookieBanner';
import { ScrollToTop } from './ScrollToTop';

export function PublicLayout() {
    return (
        <div className="theme-public min-h-screen flex flex-col bg-background">
            <ScrollToTop />
            <Navbar />
            <main className="flex-1">
                <Outlet />
            </main>
            <Footer />
            <CookieBanner />
        </div>
    );
}
