import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    AlertTriangleIcon,
    CheckCircle2Icon,
    ClockIcon,
    FilePlus2Icon,
    FileTextIcon,
} from 'lucide-react';
import { EmailVerificationAlert } from '@/components/email-verification-alert';
import { PageHeader } from '@/components/page-header';
import { PageLoader } from '@/components/page-loader';
import { RequestStatusBadge, VerificationBadge } from '@/components/status-badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { documentRequestApi } from '@/lib/api';
import { useResidentContext } from '@/hooks/use-resident-context';
import { ResidentSelectionAlert } from '@/components/resident-selection-alert';

export function DashboardPage() {
    const { user, authUser, needsResident, verificationStatus, isVerified } = useResidentContext();
    const { data: requests, isLoading } = useQuery({
        queryKey: ['document-requests', 1],
        queryFn: () => documentRequestApi.list(1),
        enabled: !needsResident,
    });

    const profile = user?.resident_profile;
    const verification = verificationStatus;

    const total = requests?.meta.total ?? 0;
    const items = requests?.data ?? [];
    const pending = items.filter((r) => !['released', 'rejected'].includes(r.status)).length;
    const released = items.filter((r) => r.status === 'released').length;

    return (
        <div>
            {needsResident && <ResidentSelectionAlert />}
            <PageHeader
                title={`Welcome, ${profile?.first_name ?? user?.name ?? 'Resident'}`}
                description={user?.barangay?.name ? `Barangay ${user.barangay.name}` : undefined}
                action={
                    <Button asChild disabled={!isVerified}>
                        <Link to="/request">
                            <FilePlus2Icon className="size-4" /> Request Document
                        </Link>
                    </Button>
                }
            />

            {authUser?.role === 'resident' && !authUser.email_verified && <EmailVerificationAlert className="mb-4" />}

            {!isVerified && (
                <Alert variant={verification === 'rejected' ? 'destructive' : 'default'} className="mb-4">
                    <AlertTriangleIcon />
                    <AlertTitle>
                        Residency {verification === 'rejected' ? 'rejected' : 'verification pending'}
                    </AlertTitle>
                    <AlertDescription>
                        {verification === 'rejected'
                            ? profile?.rejection_reason || 'Your residency proof was rejected. Please upload a new document.'
                            : 'You must be verified before requesting documents.'}{' '}
                        <Link to="/residency" className="text-primary font-medium hover:underline">
                            Manage residency
                        </Link>
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Total Requests" value={total} icon={<FileTextIcon className="size-5" />} />
                <StatCard title="In Progress" value={pending} icon={<ClockIcon className="size-5" />} />
                <StatCard title="Released" value={released} icon={<CheckCircle2Icon className="size-5" />} />
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-muted-foreground text-sm font-medium">Residency Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <VerificationBadge status={verification} />
                    </CardContent>
                </Card>
            </div>

            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Recent requests</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <PageLoader />
                    ) : items.length === 0 ? (
                        <p className="text-muted-foreground py-6 text-center text-sm">No requests yet.</p>
                    ) : (
                        <ul className="divide-y">
                            {items.slice(0, 5).map((r) => (
                                <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                                    <div className="min-w-0">
                                        <Link to={`/requests/${r.id}`} className="font-medium hover:underline">
                                            {r.document_type?.name ?? 'Document'}
                                        </Link>
                                        <p className="text-muted-foreground truncate text-xs">{r.reference_number}</p>
                                    </div>
                                    <RequestStatusBadge status={r.status} label={r.status_label} />
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function StatCard({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-muted-foreground text-sm font-medium">{title}</CardTitle>
                <span className="text-muted-foreground">{icon}</span>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold">{value}</div>
            </CardContent>
        </Card>
    );
}
