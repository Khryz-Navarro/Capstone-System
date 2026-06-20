import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { FullScreenLoader } from '@/components/page-loader';
import { roleHome } from '@/lib/navigation';
import { useAuth } from '@/providers/auth-provider';
import type { UserRole } from '@/types';

/**
 * Requires an authenticated user. Optionally restricts to specific roles.
 */
export function ProtectedRoute({ roles }: { roles?: UserRole[] }) {
    const { isAuthenticated, isLoading, user } = useAuth();
    const location = useLocation();

    if (isLoading) return <FullScreenLoader />;

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (roles && user && user.role !== 'super_admin' && !roles.includes(user.role)) {
        return <Navigate to={roleHome(user.role)} replace />;
    }

    return <Outlet />;
}

/**
 * Only accessible to guests. Authenticated users are redirected home.
 */
export function GuestRoute() {
    const { isAuthenticated, isLoading, user } = useAuth();

    if (isLoading) return <FullScreenLoader />;
    if (isAuthenticated) return <Navigate to={roleHome(user?.role)} replace />;

    return <Outlet />;
}
