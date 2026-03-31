import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, useCan } from '@/context/AuthContext';
import type { ReactNode } from 'react';

interface ProtectedRouteProps {
    children: ReactNode;
    requireAdmin?: boolean;
    permission?: string;
}

export function ProtectedRoute({ children, requireAdmin = false, permission }: ProtectedRouteProps) {
    const { isAuthenticated, isLoading, user } = useAuth();
    const can = useCan();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (requireAdmin && user?.role !== 'admin') {
        return <Navigate to="/member" replace />;
    }

    // Check specific permission requirement
    if (permission && !can(permission)) {
        return <Navigate to="/member" replace />;
    }

    return <>{children}</>;
}

export default ProtectedRoute;
