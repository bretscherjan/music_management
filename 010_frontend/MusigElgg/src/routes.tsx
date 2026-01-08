import { createBrowserRouter, RouterProvider } from 'react-router-dom';

// Layouts
import { PublicLayout } from './layouts/PublicLayout';
import { MainLayout } from './layouts/MainLayout';

// Auth
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Public Pages
import { Home } from './pages/public/Home';
import { Events } from './pages/public/Events';
import { Login } from './pages/public/Login';

// Member Pages
import { Dashboard } from './pages/member/Dashboard';
import { MusicLibraryPage } from './pages/music/MusicLibraryPage';
import { TaskBoardPage } from './pages/tasks/TaskBoardPage';
import { EventsPage } from './pages/events/EventsPage';
import { EventDetailsPage } from './pages/events/EventDetailsPage';
import { CheckInPage } from './pages/events/CheckInPage';
import { CalendarPage } from './pages/calendar/CalendarPage';
import { AttendancePage } from './pages/attendance/AttendancePage';
import { SurveysPage } from './pages/communication/SurveysPage';
import { MembersPage } from './pages/admin/MembersPage';

// Router configuration
const router = createBrowserRouter([
    // Public Routes
    {
        path: '/',
        element: <PublicLayout />,
        children: [
            {
                index: true,
                element: <Home />,
            },
            {
                path: 'events',
                element: <Events />,
            },
            {
                path: 'about',
                element: <AboutPlaceholder />,
            },
        ],
    },

    // Login Route (outside layouts)
    {
        path: '/login',
        element: <Login />,
    },

    // Protected Member Routes
    {
        path: '/',
        element: (
            <ProtectedRoute>
                <MainLayout />
            </ProtectedRoute>
        ),
        children: [
            {
                path: 'dashboard',
                element: <Dashboard />,
            },
            {
                path: 'calendar',
                element: <CalendarPage />,
            },
            {
                path: 'events-member',
                element: <EventsPage />,
            },
            {
                path: 'events/:id',
                element: <EventDetailsPage />,
            },
            {
                path: 'events/:id/checkin',
                element: <CheckInPage />,
            },
            {
                path: 'library',
                element: <MusicLibraryPage />,
            },
            {
                path: 'tasks',
                element: <TaskBoardPage />,
            },
            {
                path: 'attendance',
                element: <AttendancePage />,
            },
            {
                path: 'surveys',
                element: <SurveysPage />,
            },
            {
                path: 'members',
                element: (
                    <ProtectedRoute requiredRole="Admin">
                        <MembersPage />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'settings',
                element: <PlaceholderPage title="Einstellungen" description="Passen Sie hier Ihr Profil und Ihre Einstellungen an." />,
            },
        ],
    },
]);

// Placeholder components for future pages
function AboutPlaceholder() {
    return (
        <div className="py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h1 className="text-4xl font-bold text-primary-800 mb-6">Über uns</h1>
                <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
                    Diese Seite wird bald mit Informationen über den Verein Musig Elgg ergänzt.
                </p>
            </div>
        </div>
    );
}

function PlaceholderPage({ title, description }: { title: string; description: string }) {
    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center p-8 bg-white rounded-xl shadow-card max-w-md">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary-100 flex items-center justify-center">
                    <span className="text-2xl">🚧</span>
                </div>
                <h1 className="text-2xl font-bold text-primary-800 mb-3">{title}</h1>
                <p className="text-neutral-600">{description}</p>
                <p className="text-sm text-neutral-400 mt-4">Seite in Entwicklung</p>
            </div>
        </div>
    );
}

export function Routes() {
    return <RouterProvider router={router} />;
}
