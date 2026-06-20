import { useQuery } from '@tanstack/react-query';
import { superApi } from '@/lib/api';
import type { User, VerificationStatus } from '@/types';
import { useAuth } from '@/providers/auth-provider';

export function useResidentContext() {
    const { user: authUser, isLoading: authLoading } = useAuth();
    const isSuper = authUser?.role === 'super_admin';

    const { data: actingResident, isLoading: actingLoading } = useQuery({
        queryKey: ['super', 'acting-resident'],
        queryFn: superApi.actingResident.get,
        enabled: isSuper,
    });

    const user: User | null = isSuper ? (actingResident ?? null) : (authUser ?? null);
    const needsResident = isSuper && !actingResident;
    const residentVerification = user?.resident_profile?.verification_status;
    const verificationStatus: VerificationStatus = isSuper ? 'approved' : (residentVerification ?? 'pending');
    const isVerified = isSuper || residentVerification === 'approved';

    return {
        authUser,
        user,
        isSuper,
        isLoading: authLoading || (isSuper && actingLoading),
        needsResident,
        verificationStatus,
        isVerified,
    };
}
