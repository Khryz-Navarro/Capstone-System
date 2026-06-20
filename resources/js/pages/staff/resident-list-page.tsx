import * as React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2Icon } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/page-header';
import { PageLoader } from '@/components/page-loader';
import { VerificationBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { barangayApi, staffApi, superApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/errors';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';
import type { VerificationStatus } from '@/types';

const FILTERS = [
    { value: '', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
];

export function ResidentListPage() {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const isSuper = user?.role === 'super_admin';
    const canManageAccounts = user?.role === 'barangay_admin' || isSuper;
    const [searchParams, setSearchParams] = useSearchParams();
    const status = searchParams.get('status') ?? '';
    const barangayId = searchParams.get('barangay_id') ?? '';
    const [page, setPage] = React.useState(1);
    const [search, setSearch] = React.useState('');
    const [debouncedSearch, setDebouncedSearch] = React.useState('');

    React.useEffect(() => {
        const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
        return () => window.clearTimeout(timer);
    }, [search]);

    const { data: actingBarangay } = useQuery({
        queryKey: ['super', 'acting-barangay'],
        queryFn: superApi.actingBarangay.get,
        enabled: isSuper,
    });

    const { data: barangays = [] } = useQuery({
        queryKey: ['barangays'],
        queryFn: barangayApi.list,
        enabled: isSuper && !actingBarangay,
    });

    const showBarangayColumn = isSuper && !actingBarangay;

    const { data, isLoading } = useQuery({
        queryKey: ['staff', 'residents', status, debouncedSearch, barangayId, page, actingBarangay?.id],
        queryFn: () =>
            staffApi.residents.list({
                status,
                search: debouncedSearch,
                barangayId: barangayId ? Number(barangayId) : undefined,
                page,
            }),
    });

    const remove = useMutation({
        mutationFn: (id: number) => staffApi.residents.remove(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staff', 'residents'] });
            queryClient.invalidateQueries({ queryKey: ['staff', 'dashboard'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
            toast.success('Resident account removed.');
        },
        onError: (error) => toast.error(getApiErrorMessage(error, 'Unable to remove resident account.')),
    });

    const setStatus = (next: string) => {
        setPage(1);
        setSearchParams((current) => {
            const params = new URLSearchParams(current);
            if (next) {
                params.set('status', next);
            } else {
                params.delete('status');
            }
            return params;
        });
    };

    const setBarangayFilter = (next: string) => {
        setPage(1);
        setSearchParams((current) => {
            const params = new URLSearchParams(current);
            if (next && next !== 'all') {
                params.set('barangay_id', next);
            } else {
                params.delete('barangay_id');
            }
            return params;
        });
    };

    return (
        <div>
            <PageHeader
                title="Residents"
                description={
                    isSuper && actingBarangay
                        ? `Residents in ${actingBarangay.name}. Clear the acting barangay to browse all barangays.`
                        : 'Browse registered residents and review residency verification.'
                }
            />

            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <Input
                    value={search}
                    onChange={(event) => {
                        setPage(1);
                        setSearch(event.target.value);
                    }}
                    placeholder="Search by name, email, or mobile…"
                    className="max-w-sm"
                />

                {showBarangayColumn && (
                    <Select value={barangayId || 'all'} onValueChange={setBarangayFilter}>
                        <SelectTrigger className="w-full sm:w-56">
                            <SelectValue placeholder="All barangays" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All barangays</SelectItem>
                            {barangays.map((barangay) => (
                                <SelectItem key={barangay.id} value={String(barangay.id)}>
                                    {barangay.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}

                <div className="flex flex-wrap gap-2">
                    {FILTERS.map((filter) => (
                        <button
                            key={filter.value}
                            onClick={() => setStatus(filter.value)}
                            className={cn(
                                'rounded-full border px-3 py-1 text-sm transition-colors',
                                status === filter.value
                                    ? 'bg-primary text-primary-foreground border-primary'
                                    : 'bg-background hover:bg-muted',
                            )}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <PageLoader />
                    ) : !data || data.data.length === 0 ? (
                        <p className="text-muted-foreground py-12 text-center text-sm">No residents found.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    {showBarangayColumn && <TableHead>Barangay</TableHead>}
                                    <TableHead>Email</TableHead>
                                    <TableHead>Mobile</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.data.map((resident) => (
                                    <TableRow key={resident.id}>
                                        <TableCell className="font-medium">
                                            {resident.resident_profile?.full_name ?? resident.name}
                                        </TableCell>
                                        {showBarangayColumn && (
                                            <TableCell className="text-muted-foreground text-sm">
                                                {resident.barangay?.name ?? '—'}
                                            </TableCell>
                                        )}
                                        <TableCell className="text-muted-foreground text-sm">{resident.email}</TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {resident.resident_profile?.mobile_number ?? '—'}
                                        </TableCell>
                                        <TableCell>
                                            <VerificationBadge
                                                status={
                                                    (resident.resident_profile?.verification_status ?? 'pending') as VerificationStatus
                                                }
                                            />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link to={`/staff/residents/${resident.id}`}>View</Link>
                                                </Button>
                                                {canManageAccounts && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        disabled={remove.isPending}
                                                        onClick={() => {
                                                            const name = resident.resident_profile?.full_name ?? resident.name;
                                                            if (confirm(`Delete ${name}? This cannot be undone.`)) {
                                                                remove.mutate(resident.id);
                                                            }
                                                        }}
                                                    >
                                                        <Trash2Icon className="text-destructive size-4" />
                                                    </Button>
                                                )}
                                            </div>
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
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
                        Previous
                    </Button>
                    <span className="text-muted-foreground text-sm">
                        Page {data.meta.current_page} of {data.meta.last_page}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= data.meta.last_page}
                        onClick={() => setPage((current) => current + 1)}
                    >
                        Next
                    </Button>
                </div>
            )}
        </div>
    );
}
