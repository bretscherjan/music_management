import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { ScrollToTop } from './ScrollToTop';
import { usePageTracking } from '@/hooks/usePageTracking';

export function PublicLayout() {
    usePageTracking();
    return (
        <div className="theme-public min-h-screen flex flex-col bg-background">
            <ScrollToTop />
            <Navbar />
            <main className="flex-1">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
}
