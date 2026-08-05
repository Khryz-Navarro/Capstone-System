import type { UserRole } from '@/types';
import { isMobileApp } from '@/lib/platform';

/**
 * Resolves the default landing route for a given role.
 */
export function roleHome(role: UserRole | undefined): string {
    if (isMobileApp()) {
        return '/dashboard';
    }

    switch (role) {
        case 'barangay_staff':
        case 'barangay_admin':
            return '/staff';
        case 'super_admin':
            return '/super';
        default:
            return '/dashboard';
    }
}
