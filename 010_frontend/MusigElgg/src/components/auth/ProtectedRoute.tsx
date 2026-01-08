import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../helpers/authStore';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole?: 'Admin' | 'Member';
}

/**
 * Route guard component that protects routes from unauthenticated access.
 * Optionally requires a specific role for access.
 */
export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
    const { isAuthenticated, user, isLoading } = useAuth();
    const location = useLocation();

    // Show loading state while checking authentication
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary-800 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-neutral-600">Authentifizierung wird geprüft...</p>
                </div>
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check role if required
    if (requiredRole && user) {
        const hasAccess = requiredRole === 'Admin'
            ? user.role === 'Admin'
            : user.role === 'Admin' || user.role === 'Member';

        if (!hasAccess) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-neutral-50">
                    <div className="text-center p-8 bg-white rounded-xl shadow-card max-w-md">
                        <h2 className="text-2xl font-bold text-primary-800 mb-4">Zugriff verweigert</h2>
                        <p className="text-neutral-600 mb-6">
                            Sie haben nicht die erforderlichen Berechtigungen für diese Seite.
                        </p>
                        <a
                            href="/dashboard"
                            className="inline-block px-6 py-3 bg-primary-800 text-white rounded-lg hover:bg-primary-700 transition-colors"
                        >
                            Zurück zum Dashboard
                        </a>
                    </div>
                </div>
            );
        }
    }

    return <>{children}</>;
}
