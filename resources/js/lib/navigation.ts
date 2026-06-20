import type { UserRole } from '@/types';

/**
 * Resolves the default landing route for a given role.
 */
export function roleHome(role: UserRole | undefined): string {
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
