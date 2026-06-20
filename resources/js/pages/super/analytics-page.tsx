import { useQuery } from '@tanstack/react-query';
import { Building2Icon, CheckCircle2Icon, FileTextIcon, PackageCheckIcon, UserCogIcon, UsersIcon } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { PageLoader } from '@/components/page-loader';
import { AiSummaryCard } from '@/components/reports/ai-summary-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { superApi } from '@/lib/api';

export function SuperAnalyticsPage() {
    const { data, isLoading } = useQuery({
        queryKey: ['super', 'analytics'],
        queryFn: superApi.analytics,
    });

    return (
        <div>
            <PageHeader title="System Analytics" description="Cross-tenant overview of every barangay." />

            {isLoading || !data ? (
                <PageLoader />
            ) : (
                <>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <StatCard
                            title="Barangays"
                            value={data.totals.barangays}
                            hint={`${data.totals.active_barangays} active`}
                            icon={<Building2Icon className="size-5" />}
                        />
                        <StatCard title="Residents" value={data.totals.residents} icon={<UsersIcon className="size-5" />} />
                        <StatCard title="Staff Accounts" value={data.totals.staff} icon={<UserCogIcon className="size-5" />} />
                        <StatCard title="Total Requests" value={data.totals.requests} icon={<FileTextIcon className="size-5" />} />
                        <StatCard title="Released" value={data.totals.released} icon={<PackageCheckIcon className="size-5" />} />
                        <StatCard title="Tenants" value={data.totals.tenants} icon={<CheckCircle2Icon className="size-5" />} />
                    </div>

                    <div className="mt-6 grid gap-6 lg:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Resident registrations (6 months)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <MonthlyChart data={data.monthly_registrations} />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Document trends</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <RankedBars data={data.document_trends} />
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="mt-6">
                        <CardHeader>
                            <CardTitle className="text-base">Top barangays by requests</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {data.top_barangays.length === 0 ? (
                                <p className="text-muted-foreground py-8 text-center text-sm">No data yet.</p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Barangay</TableHead>
                                            <TableHead className="text-right">Residents</TableHead>
                                            <TableHead className="text-right">Requests</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.top_barangays.map((b) => (
                                            <TableRow key={b.name}>
                                                <TableCell className="font-medium">{b.name}</TableCell>
                                                <TableCell className="text-right">{b.residents}</TableCell>
                                                <TableCell className="text-right">{b.requests}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>

                    <AiSummaryCard
                        title="Platform AI Insights"
                        description="Cross-tenant summary for super admins — aggregate metrics only."
                        queryKey={['super', 'analytics']}
                        fetchSummary={superApi.analyticsSummary}
                        generateSummary={superApi.generateAnalyticsSummary}
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

function StatCard({ title, value, hint, icon }: { title: string; value: number; hint?: string; icon: React.ReactNode }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-muted-foreground text-sm font-medium">{title}</CardTitle>
                <span className="text-muted-foreground">{icon}</span>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold">{value}</div>
                {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
            </CardContent>
        </Card>
    );
}
