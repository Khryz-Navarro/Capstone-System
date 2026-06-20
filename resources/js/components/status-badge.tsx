import { Badge } from '@/components/ui/badge';
import type { RequestStatus, VerificationStatus } from '@/types';

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';

const requestStatusVariant: Record<RequestStatus, BadgeVariant> = {
    submitted: 'secondary',
    under_review: 'warning',
    approved: 'default',
    rejected: 'destructive',
    certificate_generated: 'default',
    ready_for_pickup: 'success',
    released: 'success',
};

const verificationVariant: Record<VerificationStatus, BadgeVariant> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'destructive',
};

export function RequestStatusBadge({ status, label }: { status: RequestStatus; label?: string }) {
    return <Badge variant={requestStatusVariant[status]}>{label ?? status.replace(/_/g, ' ')}</Badge>;
}

export function VerificationBadge({ status }: { status: VerificationStatus }) {
    const labels: Record<VerificationStatus, string> = {
        pending: 'Pending Verification',
        approved: 'Approved',
        rejected: 'Rejected',
    };
    return <Badge variant={verificationVariant[status]}>{labels[status]}</Badge>;
}
