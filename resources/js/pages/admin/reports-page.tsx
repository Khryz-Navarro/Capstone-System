import { useQuery } from '@tanstack/react-query';
import { FileStackIcon, FileTextIcon, PackageCheckIcon, ShieldAlertIcon, UserCogIcon, UsersIcon } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { PageLoader } from '@/components/page-loader';
import { AiSummaryCard } from '@/components/reports/ai-summary-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { adminApi } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';

export function ReportsPage() {
    const { user } = useAuth();
    const { data, isLoading } = useQuery({
        queryKey: ['admin', 'reports'],
        queryFn: adminApi.reports,
    });

    return (
        <div>
            <PageHeader
                title="Barangay Reports"
                description={user?.barangay?.name ? `Insights for Barangay ${user.barangay.name}` : 'Barangay insights'}
            />

            {isLoading || !data ? (
                <PageLoader />
            ) : (
                <>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <StatCard title="Residents" value={data.totals.residents} icon={<UsersIcon className="size-5" />} />
                        <StatCard
                            title="Pending Verification"
                            value={data.totals.pending_verification}
                            icon={<ShieldAlertIcon className="size-5" />}
                        />
                        <StatCard title="Staff Accounts" value={data.totals.staff} icon={<UserCogIcon className="size-5" />} />
                        <StatCard title="Document Types" value={data.totals.document_types} icon={<FileStackIcon className="size-5" />} />
                        <StatCard title="Total Requests" value={data.totals.requests} icon={<FileTextIcon className="size-5" />} />
                        <StatCard title="Released" value={data.totals.released} icon={<PackageCheckIcon className="size-5" />} />
                    </div>

                    <div className="mt-6 grid gap-6 lg:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Requests in the last 6 months</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <MonthlyChart data={data.requests_by_month} />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Most requested documents</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <RankedBars data={data.most_requested} />
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="mt-6">
                        <CardHeader>
                            <CardTitle className="text-base">Requests by status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                {data.requests_by_status.map((s) => (
                                    <div key={s.status} className="bg-muted/40 rounded-lg border p-3">
                                        <p className="text-2xl font-bold">{s.total}</p>
                                        <p className="text-muted-foreground text-xs">{s.label}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <AiSummaryCard
                        queryKey={['admin', 'reports']}
                        fetchSummary={adminApi.reportSummary}
                        generateSummary={adminApi.generateReportSummary}
                    />
                </>
            )}
        </div>
    );
}

function MonthlyChart({ data }: { data: { label: string; total: number }[] }) {
    const max = Math.max(1, ...data.map((d) => d.total));
    return (
        <div className="flex h-48 items-end justify-between gap-2">
            {data.map((d) => (
                <div key={d.label} className="flex flex-1 flex-col items-center gap-2">
                    <span className="text-muted-foreground text-xs">{d.total}</span>
                    <div
                        className="bg-primary w-full rounded-t transition-all"
                        style={{ height: `${Math.max(4, (d.total / max) * 140)}px` }}
                        title={`${d.label}: ${d.total}`}
                    />
                    <span className="text-muted-foreground text-[10px]">{d.label}</span>
                </div>
            ))}
        </div>
    );
}

function RankedBars({ data }: { data: { name: string; total: number }[] }) {
    const max = Math.max(1, ...data.map((d) => d.total));
    if (data.length === 0) {
        return <p className="text-muted-foreground text-sm">No data yet.</p>;
    }
    return (
        <div className="space-y-3">
            {data.map((d) => (
                <div key={d.name}>
                    <div className="mb-1 flex justify-between text-sm">
                        <span className="truncate font-medium">{d.name}</span>
                        <span className="text-muted-foreground">{d.total}</span>
                    </div>
                    <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                        <div className="bg-primary h-full rounded-full" style={{ width: `${(d.total / max) * 100}%` }} />
                    </div>
                </div>
            ))}
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
