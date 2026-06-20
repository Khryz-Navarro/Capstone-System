import * as React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { SearchIcon } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { PageLoader } from '@/components/page-loader';
import { RequestStatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { staffApi } from '@/lib/api';
import { cn } from '@/lib/utils';

const STATUS_FILTERS = [
    { value: '', label: 'All' },
    { value: 'submitted', label: 'New' },
    { value: 'approved', label: 'Approved' },
    { value: 'certificate_generated', label: 'Generated' },
    { value: 'ready_for_pickup', label: 'Ready' },
    { value: 'released', label: 'Released' },
    { value: 'rejected', label: 'Rejected' },
];

export function RequestQueuePage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const status = searchParams.get('status') ?? '';
    const [page, setPage] = React.useState(1);
    const [searchInput, setSearchInput] = React.useState('');
    const [search, setSearch] = React.useState('');

    const { data, isLoading } = useQuery({
        queryKey: ['staff', 'requests', status, search, page],
        queryFn: () => staffApi.requests.list({ status, search, page }),
    });

    const setStatus = (next: string) => {
        setPage(1);
        setSearchParams(next ? { status: next } : {});
    };

    const submitSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        setSearch(searchInput.trim());
    };

    return (
        <div>
            <PageHeader title="Document Requests" description="Review, process, and release resident requests." />

            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-2">
                    {STATUS_FILTERS.map((f) => (
                        <button
                            key={f.value}
                            onClick={() => setStatus(f.value)}
                            className={cn(
                                'rounded-full border px-3 py-1 text-sm transition-colors',
                                status === f.value
                                    ? 'bg-primary text-primary-foreground border-primary'
                                    : 'bg-background hover:bg-muted',
                            )}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
                <form onSubmit={submitSearch} className="flex gap-2">
                    <Input
                        placeholder="Search reference no."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        className="w-48"
                    />
                    <Button type="submit" variant="outline" size="icon">
                        <SearchIcon className="size-4" />
                    </Button>
                </form>
            </div>

            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <PageLoader />
                    ) : !data || data.data.length === 0 ? (
                        <p className="text-muted-foreground py-12 text-center text-sm">No requests found.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Reference</TableHead>
                                    <TableHead>Resident</TableHead>
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
                                        <TableCell>{r.resident?.resident_profile?.full_name ?? r.resident?.name ?? '—'}</TableCell>
                                        <TableCell className="font-medium">{r.document_type?.name ?? '—'}</TableCell>
                                        <TableCell>
                                            <RequestStatusBadge status={r.status} label={r.status_label} />
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link to={`/staff/requests/${r.id}`}>Review</Link>
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
