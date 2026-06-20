import * as React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FilePlus2Icon } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { PageLoader } from '@/components/page-loader';
import { RequestStatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { documentRequestApi } from '@/lib/api';
import { useResidentContext } from '@/hooks/use-resident-context';
import { ResidentSelectionAlert } from '@/components/resident-selection-alert';

export function RequestHistoryPage() {
    const { needsResident } = useResidentContext();
    const [page, setPage] = React.useState(1);
    const { data, isLoading } = useQuery({
        queryKey: ['document-requests', page],
        queryFn: () => documentRequestApi.list(page),
        enabled: !needsResident,
    });

    return (
        <div>
            {needsResident && <ResidentSelectionAlert />}
            <PageHeader
                title="My Requests"
                description="Track every document request you have submitted."
                action={
                    <Button asChild>
                        <Link to="/request">
                            <FilePlus2Icon className="size-4" /> New Request
                        </Link>
                    </Button>
                }
            />

            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <PageLoader />
                    ) : !data || data.data.length === 0 ? (
                        <p className="text-muted-foreground py-12 text-center text-sm">You have no requests yet.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Reference</TableHead>
                                    <TableHead>Document</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Submitted</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.data.map((r) => (
                                    <TableRow key={r.id}>
                                        <TableCell className="font-mono text-xs">{r.reference_number}</TableCell>
                                        <TableCell className="font-medium">{r.document_type?.name ?? '—'}</TableCell>
                                        <TableCell>
                                            <RequestStatusBadge status={r.status} label={r.status_label} />
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link to={`/requests/${r.id}`}>View</Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {data && data.meta.last_page > 1 && (
                <div className="mt-4 flex items-center justify-center gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                        Previous
                    </Button>
                    <span className="text-muted-foreground text-sm">
                        Page {data.meta.current_page} of {data.meta.last_page}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= data.meta.last_page}
                        onClick={() => setPage((p) => p + 1)}
                    >
                        Next
                    </Button>
                </div>
            )}
        </div>
    );
}
