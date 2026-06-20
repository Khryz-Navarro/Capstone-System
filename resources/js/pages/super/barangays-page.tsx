import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2Icon, PencilIcon, PlusIcon, SearchIcon, Trash2Icon } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/page-header';
import { PageLoader } from '@/components/page-loader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { superApi, type BarangayPayload } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/errors';
import type { Barangay } from '@/types';

const emptyForm: BarangayPayload = {
    name: '',
    code: '',
    region: '',
    province: '',
    city: '',
    contact_number: '',
    official_email: '',
    captain: '',
};

const statusVariant: Record<string, 'success' | 'warning' | 'destructive' | 'outline'> = {
    active: 'success',
    inactive: 'outline',
    suspended: 'destructive',
};

export function BarangaysPage() {
    const queryClient = useQueryClient();
    const [page, setPage] = React.useState(1);
    const [searchInput, setSearchInput] = React.useState('');
    const [search, setSearch] = React.useState('');
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [editing, setEditing] = React.useState<Barangay | null>(null);
    const [form, setForm] = React.useState<BarangayPayload>(emptyForm);

    const { data, isLoading } = useQuery({
        queryKey: ['super', 'barangays', search, page],
        queryFn: () => superApi.barangays.list({ search, page }),
    });

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: ['super', 'barangays'] });
        queryClient.invalidateQueries({ queryKey: ['super', 'analytics'] });
    };

    const save = useMutation({
        mutationFn: () => (editing ? superApi.barangays.update(editing.id, form) : superApi.barangays.create(form)),
        onSuccess: () => {
            invalidate();
            toast.success(editing ? 'Barangay updated.' : 'Barangay created.');
            setDialogOpen(false);
        },
        onError: (e) => toast.error(getApiErrorMessage(e, 'Unable to save barangay.')),
    });

    const setStatus = useMutation({
        mutationFn: ({ id, status }: { id: number; status: string }) => superApi.barangays.setStatus(id, status),
        onSuccess: () => {
            invalidate();
            toast.success('Status updated.');
        },
        onError: (e) => toast.error(getApiErrorMessage(e, 'Unable to update status.')),
    });

    const remove = useMutation({
        mutationFn: (id: number) => superApi.barangays.remove(id),
        onSuccess: () => {
            invalidate();
            toast.success('Barangay removed.');
        },
        onError: (e) => toast.error(getApiErrorMessage(e, 'Unable to remove barangay.')),
    });

    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm);
        setDialogOpen(true);
    };

    const openEdit = (b: Barangay) => {
        setEditing(b);
        setForm({
            name: b.name,
            code: b.code,
            region: b.region ?? '',
            province: b.province ?? '',
            city: b.city ?? '',
            contact_number: b.contact_number ?? '',
            official_email: b.official_email ?? '',
            captain: b.captain ?? '',
        });
        setDialogOpen(true);
    };

    const set = (key: keyof BarangayPayload, value: string) => setForm((f) => ({ ...f, [key]: value }));

    return (
        <div>
            <PageHeader
                title="Barangays"
                description="Manage every barangay tenant on the platform."
                action={
                    <Button onClick={openCreate}>
                        <PlusIcon className="size-4" /> Add Barangay
                    </Button>
                }
            />

            <form
                className="mb-4 flex gap-2"
                onSubmit={(e) => {
                    e.preventDefault();
                    setPage(1);
                    setSearch(searchInput.trim());
                }}
            >
                <Input
                    placeholder="Search barangays…"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="w-64"
                />
                <Button type="submit" variant="outline" size="icon">
                    <SearchIcon className="size-4" />
                </Button>
            </form>

            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <PageLoader />
                    ) : !data || data.data.length === 0 ? (
                        <p className="text-muted-foreground py-12 text-center text-sm">No barangays found.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Code</TableHead>
                                    <TableHead className="text-right">Residents</TableHead>
                                    <TableHead className="text-right">Requests</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.data.map((b) => (
                                    <TableRow key={b.id}>
                                        <TableCell className="font-medium">{b.name}</TableCell>
                                        <TableCell className="font-mono text-xs">{b.code}</TableCell>
                                        <TableCell className="text-right">{b.residents_count ?? 0}</TableCell>
                                        <TableCell className="text-right">{b.requests_count ?? 0}</TableCell>
                                        <TableCell>
                                            <Badge variant={statusVariant[b.status] ?? 'outline'}>{b.status}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Select
                                                    value={b.status}
                                                    onValueChange={(v) => setStatus.mutate({ id: b.id, status: v })}
                                                >
                                                    <SelectTrigger className="h-8 w-32">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="active">Active</SelectItem>
                                                        <SelectItem value="inactive">Inactive</SelectItem>
                                                        <SelectItem value="suspended">Suspended</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <Button variant="ghost" size="icon" onClick={() => openEdit(b)}>
                                                    <PencilIcon className="size-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    disabled={remove.isPending}
                                                    onClick={() => {
                                                        if (confirm(`Delete "${b.name}"? This only works if it has no data.`))
                                                            remove.mutate(b.id);
                                                    }}
                                                >
                                                    <Trash2Icon className="text-destructive size-4" />
                                                </Button>
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
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                        Previous
                    </Button>
                    <span className="text-muted-foreground text-sm">
                        Page {data.meta.current_page} of {data.meta.last_page}
                    </span>
                    <Button variant="outline" size="sm" disabled={page >= data.meta.last_page} onClick={() => setPage((p) => p + 1)}>
                        Next
                    </Button>
                </div>
            )}

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Edit barangay' : 'New barangay'}</DialogTitle>
                        <DialogDescription>
                            {editing
                                ? 'Update the barangay details.'
                                : 'Creates a new tenant, barangay, and default document types.'}
                        </DialogDescription>
                    </DialogHeader>

                    <form
                        id="barangay-form"
                        className="space-y-4"
                        onSubmit={(e) => {
                            e.preventDefault();
                            save.mutate();
                        }}
                    >
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Name">
                                <Input value={form.name} onChange={(e) => set('name', e.target.value)} required />
                            </Field>
                            <Field label="Code">
                                <Input value={form.code} onChange={(e) => set('code', e.target.value)} required />
                            </Field>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Region">
                                <Input value={form.region} onChange={(e) => set('region', e.target.value)} />
                            </Field>
                            <Field label="Province">
                                <Input value={form.province} onChange={(e) => set('province', e.target.value)} />
                            </Field>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="City / Municipality">
                                <Input value={form.city} onChange={(e) => set('city', e.target.value)} />
                            </Field>
                            <Field label="Contact number">
                                <Input value={form.contact_number} onChange={(e) => set('contact_number', e.target.value)} />
                            </Field>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Official email">
                                <Input type="email" value={form.official_email} onChange={(e) => set('official_email', e.target.value)} />
                            </Field>
                            <Field label="Barangay captain">
                                <Input value={form.captain} onChange={(e) => set('captain', e.target.value)} />
                            </Field>
                        </div>
                    </form>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" form="barangay-form" disabled={save.isPending}>
                            {save.isPending && <Loader2Icon className="size-4 animate-spin" />}
                            {editing ? 'Save changes' : 'Create barangay'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            {children}
        </div>
    );
}
