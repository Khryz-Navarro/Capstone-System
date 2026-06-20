import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2Icon, ClipboardListIcon, FileCheck2Icon, InboxIcon, PackageCheckIcon, UsersIcon } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { PageLoader } from '@/components/page-loader';
import { RequestStatusBadge } from '@/components/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { staffApi } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';

export function StaffDashboardPage() {
    const { user } = useAuth();
    const { data, isLoading } = useQuery({
        queryKey: ['staff', 'dashboard'],
        queryFn: staffApi.dashboard,
    });

    return (
        <div>
            <PageHeader
                title="Staff Dashboard"
                description={user?.barangay?.name ? `Barangay ${user.barangay.name}` : 'Manage requests and residents'}
            />

            {isLoading || !data ? (
                <PageLoader />
            ) : (
                <>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <StatCard
                            title="Pending Verifications"
                            value={data.residents.pending_verification}
                            icon={<UsersIcon className="size-5" />}
                            to="/staff/residents?status=pending"
                        />
                        <StatCard
                            title="New Requests"
                            value={data.requests.submitted}
                            icon={<InboxIcon className="size-5" />}
                            to="/staff/requests?status=submitted"
                        />
                        <StatCard
                            title="Approved"
                            value={data.requests.approved}
                            icon={<FileCheck2Icon className="size-5" />}
                            to="/staff/requests?status=approved"
                        />
                        <StatCard
                            title="Ready for Pickup"
                            value={data.requests.ready_for_pickup}
                            icon={<PackageCheckIcon className="size-5" />}
                            to="/staff/requests?status=ready_for_pickup"
                        />
                    </div>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <StatCard title="Total Residents" value={data.residents.total} icon={<UsersIcon className="size-5" />} />
                        <StatCard title="Total Requests" value={data.requests.total} icon={<ClipboardListIcon className="size-5" />} />
                        <StatCard title="Generated" value={data.requests.generated} icon={<FileCheck2Icon className="size-5" />} />
                        <StatCard title="Released" value={data.requests.released} icon={<CheckCircle2Icon className="size-5" />} />
                    </div>

                    <Card className="mt-6">
                        <CardHeader>
                            <CardTitle>Recent requests</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {data.recent_requests.length === 0 ? (
                                <p className="text-muted-foreground py-6 text-center text-sm">No requests yet.</p>
                            ) : (
                                <ul className="divide-y">
                                    {data.recent_requests.map((r) => (
                                        <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                                            <div className="min-w-0">
                                                <Link to={`/staff/requests/${r.id}`} className="font-medium hover:underline">
                                                    {r.document_type?.name ?? 'Document'}
                                                </Link>
                                                <p className="text-muted-foreground truncate text-xs">
                                                    {r.reference_number}
                                                    {r.resident?.resident_profile?.full_name
                                                        ? ` · ${r.resident.resident_profile.full_name}`
                                                        : ''}
                                                </p>
                                            </div>
                                            <RequestStatusBadge status={r.status} label={r.status_label} />
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}

function StatCard({ title, value, icon, to }: { title: string; value: number; icon: React.ReactNode; to?: string }) {
    const card = (
        <Card className={to ? 'hover:border-primary/50 transition-colors' : undefined}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-muted-foreground text-sm font-medium">{title}</CardTitle>
                <span className="text-muted-foreground">{icon}</span>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold">{value}</div>
            </CardContent>
        </Card>
    );

    return to ? <Link to={to}>{card}</Link> : card;
}
